library(stringr)
library(dplyr)
library(xgboost)
library(ranger)
library(plumber)
library(jsonlite)

# Load predictors and saved models first
source("Predictors/Prediction.R")
source("Predictors/predhouse.R")
source("Predictors/pred_rent.R")

# Load market intelligence router
source("market_router.R")
source("Nemotron.R")
source("Prompts.R")
source("Extraction.R")
source("area_conversion.R")
source("Category_Normalization.R")
source("Validation.R")
source("Model_router.R")
source("Conversation.R")

# Initialize datasets once at backend startup
PROPGPT_MARKET_DATA <- initialize_market_intelligence(
  flat_path = file.path("Datasets", "flat.csv"),
  house_path = file.path("Datasets", "house.csv"),
  rent_path = file.path("Datasets", "rental.csv"),
  module_dir = "market_intelligence"
)




# ============================================================
# PROPGPT - PLUMBER API
# Plumber 1.3.3
# ============================================================

library(plumber)
library(jsonlite)

#* Enable CORS for frontend access
#* @filter cors
cors <- function(req, res) {
  allowed <- strsplit(Sys.getenv("CORS_ORIGINS", "http://127.0.0.1:5173,http://localhost:5173"), ",", fixed = TRUE)[[1]]
  origin <- req$HTTP_ORIGIN
  if (!is.null(origin) && origin %in% trimws(allowed)) {
    res$setHeader("Access-Control-Allow-Origin", origin)
    res$setHeader("Vary", "Origin")
  }
  res$setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
  res$setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Accept, Origin, User-Agent")
  
  if (identical(req$REQUEST_METHOD, "OPTIONS")) {
    res$status <- 200
    return(list())
  }
  
  plumber::forward()
}

#* Validate direct predictions with the same schema used by conversations.
#* @filter prediction_validation
function(req, res) {
  intents <- c("/predict/flat" = "flat_purchase", "/predict/house" = "house_purchase", "/predict/rent" = "rent")
  if (!req$PATH_INFO %in% names(intents) || req$REQUEST_METHOD != "POST") return(plumber::forward())
  body <- req$body
  if (is.null(body) && !is.null(req$postBody)) {
    body <- tryCatch(jsonlite::fromJSON(req$postBody, simplifyVector = FALSE), error = function(e) NULL)
  }
  if (!is.list(body) || is.null(names(body))) {
    res$status <- 400
    return(list(success = FALSE, error = "Send a JSON object with property details."))
  }
  if (!is.null(body$session_id) && (!is.character(body$session_id) || length(body$session_id) != 1 ||
      is.na(body$session_id) || !grepl("^[A-Za-z0-9_-]{1,128}$", body$session_id))) {
    res$status <- 400
    return(list(success = FALSE, error = "A valid session_id is required."))
  }
  property <- empty_extraction()
  property$intent <- unname(intents[[req$PATH_INFO]])
  mapping <- c(query_area = "area", query_bhk = "bhk", query_locality = "locality",
    query_Furnishing = "furnishing", query_furnishing = "furnishing",
    query_Transaction = "transaction", query_transaction = "transaction",
    query_area_source = "area_source", query_Bathroom = "bathroom", query_bathroom = "bathroom",
    query_Balcony = "balcony", query_balcony = "balcony", query_ownership = "ownership",
    query_facing = "facing", query_buy_floor = "buy_floor", query_total_floors = "total_floors")
  for (key in intersect(names(body), names(mapping))) property[mapping[[key]]] <- list(body[[key]])
  validation <- tryCatch(validate_property(property), error = function(e) NULL)
  if (is.null(validation) || !isTRUE(validation$ready_for_prediction)) {
    res$status <- 400
    return(list(success = FALSE, error = if (is.null(validation)) "Invalid property details." else
      paste(c(validation$errors, if (length(validation$missing_fields)) paste("Missing:", paste(validation$missing_fields, collapse = ", "))), collapse = " ")))
  }
  for (key in intersect(names(body), names(mapping))) body[key] <- list(validation$data[[mapping[[key]]]])
  req$validated_body <- body
  req$validated_property <- validation$data
  plumber::forward()
}

# Retain manual estimates in the existing conversation store so explaining a
# completed valuation does not execute its model again.
record_manual_prediction <- function(req, prediction) {
  id <- req$validated_body$session_id
  if (is.null(id)) return(NULL)
  property <- resolve_prediction_defaults(req$validated_property)
  create_conversation_session(id)
  session <- get_conversation_session(id)
  session$property <- property
  session$optional_fields_asked <- TRUE
  session$stage <- "completed"
  session$last_prediction <- list(success = TRUE, intent = property$intent, prediction = prediction, property = property)
  session$last_market_context <- get_market_context(property$intent, property, PROPGPT_MARKET_DATA)
  PROPGPT_SESSIONS[[id]] <- session
  id
}

# Load your prediction function and model dependencies.
# Adjust these paths to match your project.

# ------------------------------------------------------------
# HEALTH CHECK
# ------------------------------------------------------------

#* Check API health
#* @get /health
function() {
  list(
    status = "ok",
    service = "PropGPT"
  )
}


# ------------------------------------------------------------
# FLAT PRICE PREDICTION
# ------------------------------------------------------------

#* Predict flat purchase price
#* @post /predict/flat
#* @parser json
function(req, res) {
  
  body <- if (!is.null(req$validated_body)) req$validated_body else req$body
  
  # 1. Normalize request body
  if (is.raw(body)) {
    body <- tryCatch(
      jsonlite::fromJSON(
        rawToChar(body),
        simplifyVector = FALSE
      ),
      error = function(e) NULL
    )
  } else if (is.character(body) && length(body) == 1L) {
    body <- tryCatch(
      jsonlite::fromJSON(
        body,
        simplifyVector = FALSE
      ),
      error = function(e) NULL
    )
  }
  
  # 2. Validate JSON object
  if (is.null(body) ||
      !is.list(body) ||
      is.null(names(body))) {
    
    res$status <- 400
    
    return(list(
      success = FALSE,
      error = "Invalid JSON request body."
    ))
  }
  
  # 3. Required fields
  required_fields <- c(
    "query_area",
    "query_bhk",
    "query_locality"
  )
  
  missing_fields <- required_fields[
    !vapply(required_fields, function(x) {
      value <- body[[x]]
      
      !is.null(value) &&
        length(value) == 1L &&
        !is.na(value) &&
        nzchar(trimws(as.character(value)))
    }, logical(1))
  ]
  
  if (length(missing_fields) > 0L) {
    res$status <- 400
    
    return(list(
      success = FALSE,
      error = "Missing required fields.",
      missing_fields = missing_fields
    ))
  }
  
  # 4. Numerical validation
  area <- suppressWarnings(as.numeric(body[["query_area"]]))
  bhk <- suppressWarnings(as.numeric(body[["query_bhk"]]))
  
  if (length(area) != 1L || !is.finite(area) || area <= 0) {
    res$status <- 400
    return(list(
      success = FALSE,
      error = "query_area must be a positive number."
    ))
  }
  
  if (length(bhk) != 1L ||
      !is.finite(bhk) ||
      bhk <= 0 ||
      bhk != floor(bhk)) {
    res$status <- 400
    return(list(
      success = FALSE,
      error = "query_bhk must be a positive whole number."
    ))
  }
  
  bathroom <- NULL
  if (!is.null(body[["query_Bathroom"]])) {
    bathroom_val <- suppressWarnings(as.numeric(body[["query_Bathroom"]]))
    if (length(bathroom_val) != 1L || !is.finite(bathroom_val) || bathroom_val < 0 || bathroom_val != floor(bathroom_val)) {
      res$status <- 400
      return(list(
        success = FALSE,
        error = "query_Bathroom must be a non-negative whole number."
      ))
    }
    bathroom <- bathroom_val
  }
  
  balcony <- NULL
  if (!is.null(body[["query_Balcony"]])) {
    balcony_val <- suppressWarnings(as.numeric(body[["query_Balcony"]]))
    if (length(balcony_val) != 1L || !is.finite(balcony_val) || balcony_val < 0 || balcony_val != floor(balcony_val)) {
      res$status <- 400
      return(list(
        success = FALSE,
        error = "query_Balcony must be a non-negative whole number."
      ))
    }
    balcony <- balcony_val
  }
  
  # 5. Locality
  locality <- trimws(as.character(body[["query_locality"]]))
  
  if (length(locality) != 1L ||
      is.na(locality) ||
      !nzchar(locality)) {
    
    res$status <- 400
    return(list(
      success = FALSE,
      error = "Invalid locality."
    ))
  }
  
  # 6. Categorical values
  furnishing <- body[["query_Furnishing"]]
  transaction <- body[["query_Transaction"]]
  area_source <- body[["query_area_source"]]
  
  # 7. Model prediction
  result <- tryCatch({
    
    pred_price_flat(
      query_area = area,
      query_bhk = bhk,
      query_locality = locality,
      query_Furnishing = furnishing,
      query_Transaction = transaction,
      query_area_source = area_source,
      query_Bathroom = bathroom,
      query_Balcony = balcony
    )
    
  }, error = function(e) {
    
    message(
      "FLAT PREDICTION ERROR: ",
      conditionMessage(e)
    )
    
    return(structure(
      list(error = conditionMessage(e)),
      class = "flat_prediction_error"
    ))
  })
  
  # 8. Handle model failure
  if (inherits(result, "flat_prediction_error")) {
    
    err_msg <- result$error
    if (grepl("Invalid|Unsupported", err_msg, ignore.case = TRUE)) {
      res$status <- 400
      return(list(
        success = FALSE,
        error = err_msg
      ))
    }
    
    res$status <- 500
    
    return(list(
      success = FALSE,
      error = "Flat prediction failed.",
      details = "The valuation model is temporarily unavailable. Please try again."
    ))
  }
  
  # 9. Successful response
  list(
    success = TRUE,
    prediction_type = "flat_price",
    session_id = record_manual_prediction(req, result),
    predicted_price = result,
    currency = "INR"
  )
}



# ============================================================
# HOUSE PRICE PREDICTION
# ============================================================

#* Predict house purchase price
#* @post /predict/house
#* @parser json
function(req, res) {
  
  body <- if (!is.null(req$validated_body)) req$validated_body else req$body
  
  # Validate JSON body
  if (is.null(body) || !is.list(body) || is.null(names(body))) {
    res$status <- 400
    return(list(
      error = "Invalid request body. Send a JSON object."
    ))
  }
  
  # Required fields
  required_fields <- c(
    "query_area",
    "query_bhk",
    "query_locality"
  )
  
  missing_fields <- required_fields[
    !vapply(
      required_fields,
      function(x) {
        !is.null(body[[x]]) &&
          length(body[[x]]) == 1L &&
          !is.na(body[[x]]) &&
          nzchar(trimws(as.character(body[[x]])))
      },
      logical(1)
    )
  ]
  
  if (length(missing_fields) > 0L) {
    res$status <- 400
    return(list(
      error = "Missing required fields.",
      missing_fields = missing_fields
    ))
  }
  
  # Convert numerical inputs
  area <- suppressWarnings(as.numeric(body[["query_area"]]))
  bhk <- suppressWarnings(as.numeric(body[["query_bhk"]]))
  
  if (length(area) != 1L || !is.finite(area) || area <= 0) {
    res$status <- 400
    return(list(error = "query_area must be a positive number."))
  }
  
  if (length(bhk) != 1L ||
      !is.finite(bhk) ||
      bhk <= 0 ||
      bhk != floor(bhk)) {
    res$status <- 400
    return(list(error = "query_bhk must be a positive whole number."))
  }
  
  locality <- trimws(as.character(body[["query_locality"]]))
  
  # Run house prediction
  result <- tryCatch({
    
    pred_house(
      query_area = area,
      query_bhk = bhk,
      query_locality = locality,
      
      query_furnishing = body[["query_furnishing"]],
      query_area_source = body[["query_area_source"]],
      query_transaction = body[["query_transaction"]],
      query_bathroom = body[["query_bathroom"]],
      query_balcony = body[["query_balcony"]],
      query_ownership = body[["query_ownership"]],
      query_facing = body[["query_facing"]],
      query_buy_floor = body[["query_buy_floor"]],
      query_total_floors = body[["query_total_floors"]]
    )
    
  }, error = function(e) {
    
    message(
      "House prediction error: ",
      conditionMessage(e)
    )
    
    NULL
  })
  
  # Handle errors
  if (is.null(result)) {
    res$status <- 500
    return(list(
      error = "House prediction failed. Check backend logs."
    ))
  }
  
  # Successful response
  list(
    success = TRUE,
    prediction_type = "house_price",
    session_id = record_manual_prediction(req, result),
    predicted_price = result,
    currency = "INR"
  )
}



# ============================================================
# RENT PRICE PREDICTION
# ============================================================

#* Predict rental price
#* @post /predict/rent
#* @parser json
function(req, res) {
  
  body <- if (!is.null(req$validated_body)) req$validated_body else req$body
  
  # Validate JSON body
  if (is.null(body) || !is.list(body) || is.null(names(body))) {
    res$status <- 400
    return(list(
      error = "Invalid request body. Send a JSON object."
    ))
  }
  
  # Required fields
  required_fields <- c(
    "query_area",
    "query_bhk",
    "query_locality"
  )
  
  missing_fields <- required_fields[
    !vapply(
      required_fields,
      function(x) {
        !is.null(body[[x]]) &&
          length(body[[x]]) == 1L &&
          !is.na(body[[x]]) &&
          nzchar(trimws(as.character(body[[x]])))
      },
      logical(1)
    )
  ]
  
  if (length(missing_fields) > 0L) {
    res$status <- 400
    return(list(
      error = "Missing required fields.",
      missing_fields = missing_fields
    ))
  }
  
  # Convert numerical inputs
  area <- suppressWarnings(as.numeric(body[["query_area"]]))
  bhk <- suppressWarnings(as.numeric(body[["query_bhk"]]))
  
  if (length(area) != 1L || !is.finite(area) || area <= 0) {
    res$status <- 400
    return(list(error = "query_area must be a positive number."))
  }
  
  if (length(bhk) != 1L ||
      !is.finite(bhk) ||
      bhk <= 0 ||
      bhk != floor(bhk)) {
    res$status <- 400
    return(list(error = "query_bhk must be a positive whole number."))
  }
  
  locality <- trimws(as.character(body[["query_locality"]]))
  
  # Run rent prediction
  result <- tryCatch({
    
    pred_rent(
      query_area = area,
      query_bhk = bhk,
      query_locality = locality,
      
      query_furnishing = body[["query_furnishing"]],
      query_area_source = body[["query_area_source"]],
      query_bathroom = body[["query_bathroom"]],
      query_balcony = body[["query_balcony"]],
      query_buy_floor = body[["query_buy_floor"]],
      query_total_floors = body[["query_total_floors"]]
    )
    
  }, error = function(e) {
    
    message(
      "Rent prediction error: ",
      conditionMessage(e)
    )
    
    NULL
  })
  
  # Handle errors
  if (is.null(result)) {
    res$status <- 500
    return(list(
      error = "Rent prediction failed. Check backend logs."
    ))
  }
  
  # Successful response
  list(
    success = TRUE,
    prediction_type = "rent",
    session_id = record_manual_prediction(req, result),
    predicted_price = result,
    currency = "INR",
    period = "monthly"
  )
}

# PROPGPT - CONVERSATION API


#* Process a conversation
#* @post /chat
#* @parser json
function(req, res) {
  
  body <- if (!is.null(req$validated_body)) req$validated_body else req$body
  
  if (
    is.null(body) ||
    !is.list(body) ||
    is.null(names(body))
  ) {
    
    res$status <- 400
    
    return(list(
      error = "Invalid JSON request body."
    ))
    
  }
  
  session_id <- body[["session_id"]]
  user_message <- body[["message"]]
  
  if (
    is.null(session_id) ||
    !is.character(session_id) ||
    length(session_id) != 1 ||
    is.na(session_id) ||
    !grepl("^[A-Za-z0-9_-]{1,128}$", session_id)
  ) {
    
    res$status <- 400
    
    return(list(
      error = "A valid session_id is required."
    ))
    
  }
  
  if (
    is.null(user_message) ||
    !is.character(user_message) ||
    length(user_message) != 1 ||
    is.na(user_message) ||
    !nzchar(trimws(user_message)) || nchar(user_message) > 8000
  ) {
    
    res$status <- 400
    
    return(list(
      error = "A valid message is required."
    ))
    
  }
  
  result <- tryCatch(
    process_conversation(
      session_id = session_id,
      user_message = user_message,
      market_data = PROPGPT_MARKET_DATA
    ),
    error = function(e) {
      message(
        "Conversation API error: ",
        conditionMessage(e)
      )
      NULL
    }
  )
  
  if (is.null(result)) {
    
    res$status <- 500
    
    return(list(
      error = "Unable to process conversation."
    ))
    
  }
  
  if (!is.null(result$error_code)) res$status <- 503
  result
  
}

