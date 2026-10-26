

# LLM Response Extraction Module

# REQUIRED JSON FIELDS


PROPGPT_FIELDS <- c(
  "intent",
  "area",
  "bhk",
  "locality",
  "area_unit",
  "furnishing",
  "transaction",
  "area_source",
  "bathroom",
  "balcony",
  "ownership",
  "facing",
  "buy_floor",
  "total_floors",
  "missing_fields",
  "ready_for_prediction",
  "reply",
  "action", "market_localities"
)


# 2. DEFAULT EXTRACTION STRUCTURE


empty_extraction <- function() {
  
  list(
    intent = NULL,
    area = NULL,
    bhk = NULL,
    locality = NULL,
    area_unit = NULL,
    furnishing = NULL,
    transaction = NULL,
    area_source = NULL,
    bathroom = NULL,
    balcony = NULL,
    ownership = NULL,
    facing = NULL,
    buy_floor = NULL,
    total_floors = NULL,
    missing_fields = c("intent", "area", "bhk", "locality"),
    ready_for_prediction = FALSE,
    reply = ""
  )
  
}


# 3. EXTRACT JSON FROM MODEL RESPONSE


extract_json_text <- function(response_text) {
  
  if (
    !is.character(response_text) ||
    length(response_text) != 1 ||
    is.na(response_text) ||
    !nzchar(trimws(response_text))
  ) {
    stop("Nemotron returned an empty response.")
  }
  
  response_text <- trimws(response_text)
  
  # Remove Markdown code fences if the model includes them.
  
  response_text <- sub(
    "^```(?:json)?[[:space:]]*",
    "",
    response_text,
    ignore.case = TRUE
  )
  
  response_text <- sub(
    "[[:space:]]*```[[:space:]]*$",
    "",
    response_text
  )
  
  response_text <- trimws(response_text)
  
  # Locate the JSON object.
  
  start_position <- regexpr("\\{", response_text)[1]
  
  end_position <- tail(
    gregexpr("\\}", response_text)[[1]],
    1
  )
  
  if (start_position < 1 || end_position < start_position) {
    stop("No valid JSON object found in Nemotron response.")
  }
  
  substr(
    response_text,
    start_position,
    end_position
  )
  
}



# 4. PARSE JSON INTO R LIST


parse_nemotron_response <- function(response_text) {
  
  if (!requireNamespace("jsonlite", quietly = TRUE)) {
    stop("Please install jsonlite.")
  }
  
  json_text <- extract_json_text(response_text)
  
  parsed <- tryCatch(
    
    jsonlite::fromJSON(
      json_text,
      simplifyVector = FALSE
    ),
    
    error = function(e) {
      stop(
        "Could not parse Nemotron JSON: ",
        conditionMessage(e)
      )
    }
    
  )
  
  if (!is.list(parsed) || is.null(names(parsed))) {
    stop("Nemotron JSON must contain a named object.")
  }
  
  # Start with a complete default structure.
  
  result <- empty_extraction()
  
  # Copy only recognized fields.
  
  for (field in intersect(names(parsed), PROPGPT_FIELDS)) {
    
    result[[field]] <- parsed[[field]]
    
  }
  
  result
  
}



# 5. NORMALIZE EXTRACTED DATA


normalize_extraction <- function(data) {
  
  if (!is.list(data)) {
    stop("Extraction data must be an R list.")
  }
  
  # Normalize locality.
  
  if (is.character(data$locality) && length(data$locality) == 1) {
    
    data$locality <- trimws(data$locality)
    
    if (!nzchar(data$locality)) {
      data$locality <- NULL
    }
    
  }
  
  # Normalize intent.
  
  if (is.character(data$intent) && length(data$intent) == 1) {
    
    data$intent <- tolower(trimws(data$intent))
    
  }
  
  # Normalize numeric fields.
  
  numeric_fields <- c(
    "area",
    "bhk",
    "bathroom",
    "balcony",
    "buy_floor",
    "total_floors"
  )
  
  for (field in numeric_fields) {
    
    value <- data[[field]]
    
    if (!is.null(value)) {
      
      if (
        length(value) != 1 ||
        is.logical(value) ||
        is.list(value) ||
        is.na(value)
      ) {
        data[[field]] <- "invalid"
        next
      }
      
      if (is.numeric(value)) {
        data[[field]] <- value
      } else if (is.character(value) && nzchar(trimws(value))) {
        clean_str <- tolower(trimws(value))
        if (clean_str %in% c("null", "none", "unknown", "n/a", "na", "not specified", "not provided", "nil", "skip")) {
          data[[field]] <- NULL
        } else {
          converted <- suppressWarnings(
            as.numeric(trimws(value))
          )
          
          if (!is.na(converted)) {
            data[[field]] <- converted
          } else {
            data[[field]] <- "invalid"
          }
        }
      } else {
        data[[field]] <- NULL
      }
      
    }
    
  }
  
  # Ensure missing_fields is a character vector.
  
  if (is.null(data$missing_fields)) {
    
    data$missing_fields <- character(0)
    
  } else {
    
    data$missing_fields <- as.character(data$missing_fields)
    
  }
  
  # Ensure ready_for_prediction is a logical value.
  
  if (
    !is.logical(data$ready_for_prediction) ||
    length(data$ready_for_prediction) != 1 ||
    is.na(data$ready_for_prediction)
  ) {
    
    data$ready_for_prediction <- FALSE
    
  }
  
  # Ensure reply is a single string.
  
  if (
    !is.character(data$reply) ||
    length(data$reply) != 1 ||
    is.na(data$reply)
  ) {
    
    data$reply <- ""
    
  }
  
  data
  
}



# 6. COMPLETE EXTRACTION PIPELINE


extract_property_details <- function(response_text) {
  
  parsed_data <- parse_nemotron_response(response_text)
  
  normalized_data <- normalize_extraction(parsed_data)
  
  return(normalized_data)
  
}
