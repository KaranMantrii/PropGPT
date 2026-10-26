source("area_conversion.R")
source("Category_Normalization.R")
# Data Validation

# Required fields for every prediction
REQUIRED_FIELDS <- c(
  "intent",
  "area",
  "bhk",
  "locality"
)


# Supported prediction intents
VALID_INTENTS <- c(
  "flat_purchase",
  "house_purchase",
  "rent"
)


# Check whether a value is empty or missing
is_empty_value <- function(value) {
  
  if (is.null(value) || length(value) == 0) {
    return(TRUE)
  }
  
  if (is.character(value)) {
    if (length(value) == 1) {
      if (is.na(value)) return(TRUE)
      clean_val <- tolower(trimws(value))
      return(
        !nzchar(clean_val) ||
        clean_val %in% c("null", "none", "unknown", "n/a", "na", "not specified", "not provided", "nil", "undefined", "skip")
      )
    }
  }
  
  if (length(value) == 1 && is.atomic(value) && is.na(value)) {
    return(TRUE)
  }
  
  FALSE
}


# Check whether a value is a valid positive number
is_positive_number <- function(value) {
  
  if (is_empty_value(value)) {
    return(FALSE)
  }
  
  number <- suppressWarnings(as.numeric(value))
  
  length(number) == 1 &&
    !is.na(number) &&
    is.finite(number) &&
    number > 0
}


# Check whether a value is a non-negative number
is_non_negative_number <- function(value) {
  
  if (is_empty_value(value)) {
    return(TRUE)
  }
  
  number <- suppressWarnings(as.numeric(value))
  
  length(number) == 1 &&
    !is.na(number) &&
    is.finite(number) &&
    number >= 0
}


# Check whether a value is a positive integer
is_positive_integer <- function(value) {
  
  if (!is_positive_number(value)) {
    return(FALSE)
  }
  
  number <- as.numeric(value)
  
  number == floor(number)
}


# Main validation function
validate_property <- function(property) {
  
  if (!is.list(property)) {
    stop("Property data must be an R list.")
  }
  
  # Make sure all expected fields exist
  for (field in PROPGPT_FIELDS) {
    if (is.null(property[[field]])) {
      property[[field]] <- NULL
    }
  }
  
  errors <- character(0)
  missing_fields <- character(0)
  for (field in intersect(names(property), c("intent", "area", "area_unit", "bhk", "locality", "furnishing", "transaction", "area_source", "bathroom", "balcony", "ownership", "facing", "buy_floor", "total_floors"))) {
    value <- property[[field]]
    if (!is.null(value) && (length(value) != 1 || !is.atomic(value) || is.logical(value))) {
      return(list(valid = FALSE, ready_for_prediction = FALSE, missing_fields = character(0),
        errors = paste(field, "must contain one valid value."), data = property))
    }
  }
  
  
  # ------------------------------------------
  # 1. Validate intent
  # ------------------------------------------
  
  if (is_empty_value(property$intent)) {
    
    missing_fields <- c(missing_fields, "intent")
    
  } else if (
    !tolower(trimws(as.character(property$intent))) %in%
    VALID_INTENTS
  ) {
    
    errors <- c(
      errors,
      "Invalid intent. Supported intents are flat_purchase, house_purchase, and rent."
    )
    
  } else {
    
    property$intent <- tolower(
      trimws(as.character(property$intent))
    )
    
  }
  
  
  # Validate and convert area to square feet

  if (is_empty_value(property$area)) {
    
    missing_fields <- c(missing_fields, "area")
    
  } else if (!is_positive_number(property$area)) {
    
    errors <- c(
      errors,
      "Area must be a valid positive number."
    )
    
  } else {
    
    # Default unit convention: sqft
    area_unit <- property$area_unit
    
    if (is_empty_value(area_unit)) {
      area_unit <- "sqft"
    }
    
    conversion <- tryCatch(
      convert_area_to_sqft(
        area = property$area,
        unit = area_unit
      ),
      error = function(e) e
    )
    
    if (inherits(conversion, "error")) {
      
      errors <- c(errors, conditionMessage(conversion))
      
    } else {
      
      # Store original value for conversation display
      property$original_area <- conversion$original_area
      property$original_area_unit <- conversion$original_unit
      
      # All prediction models receive sqft
      property$area <- conversion$area_sqft
      property$area_unit <- "sqft"
      
    }
    
  }
  
  
  # ------------------------------------------
  # 3. Validate BHK
  # ------------------------------------------
  
  if (is_empty_value(property$bhk)) {
    
    missing_fields <- c(missing_fields, "bhk")
    
  } else if (!is_positive_integer(property$bhk)) {
    
    errors <- c(
      errors,
      "BHK must be a positive whole number."
    )
    
  } else {
    
    property$bhk <- as.integer(property$bhk)
    
  }
  
  
  # ------------------------------------------
  # 4. Validate locality
  # ------------------------------------------
  
  if (is_empty_value(property$locality)) {
    
    missing_fields <- c(missing_fields, "locality")
    
  } else if (!is.character(property$locality) || nchar(property$locality) > 150) {
    
    errors <- c(
      errors,
      "Locality must be provided as text."
    )
    
  } else {
    
    property$locality <- trimws(property$locality)
    
  }
  
  
  # ------------------------------------------
  # 5. Validate optional numeric fields
  # ------------------------------------------
  
  optional_numeric_fields <- c(
    "bathroom",
    "balcony"
  )
  
  for (field in optional_numeric_fields) {
    
    value <- property[[field]]
    
    if (!is_empty_value(value)) {
      
      if (!is_non_negative_number(value) || as.numeric(value) != floor(as.numeric(value))) {
        
        errors <- c(
          errors,
          paste(field, "must be a valid non-negative whole number.")
        )
        
      } else {
        
        property[[field]] <- as.numeric(value)
        
      }
      
    }
  }
  
  
  # ------------------------------------------
  # 6. Validate floor information
  # ------------------------------------------
  
  floor_fields <- c(
    "buy_floor",
    "total_floors"
  )
  
  for (field in floor_fields) {
    
    value <- property[[field]]
    
    if (!is_empty_value(value)) {
      
      if (!(if (field == "buy_floor") is_non_negative_number(value) && as.numeric(value) == floor(as.numeric(value)) else is_positive_integer(value))) {
        
        errors <- c(
          errors,
          paste(field, if (field == "buy_floor") "must be a non-negative whole number." else "must be a positive whole number.")
        )
        
      } else {
        
        property[[field]] <- as.integer(value)
        
      }
      
    }
  }
  
  
  # Floor cannot exceed total floors
  if (
    is_positive_integer(property$buy_floor) &&
    is_positive_integer(property$total_floors) &&
    property$buy_floor > property$total_floors
  ) {
    
    errors <- c(
      errors,
      "Property floor cannot exceed total floors."
    )
    
  }
  
  
  # ------------------------------------------
  # Normalize furnishing, transaction, and area_source categories
  # ------------------------------------------
  
  if (!is_empty_value(property$furnishing)) {
    furnishing_result <- tryCatch(
      normalize_furnishing(property$furnishing),
      error = function(e) e
    )
    if (inherits(furnishing_result, "error")) {
      errors <- c(errors, conditionMessage(furnishing_result))
    } else {
      property$furnishing <- furnishing_result
    }
  }
  
  if (!is_empty_value(property$transaction)) {
    transaction_result <- tryCatch(
      normalize_transaction(property$transaction),
      error = function(e) e
    )
    if (inherits(transaction_result, "error")) {
      errors <- c(errors, conditionMessage(transaction_result))
    } else {
      property$transaction <- transaction_result
    }
  }
  
  if (!is_empty_value(property$area_source)) {
    area_source_result <- tryCatch(
      normalize_area_source(property$area_source),
      error = function(e) e
    )
    if (inherits(area_source_result, "error")) {
      errors <- c(errors, conditionMessage(area_source_result))
    } else {
      property$area_source <- area_source_result
    }
  }
  
  
  
  # ------------------------------------------
  # 7. Recalculate missing fields
  # ------------------------------------------
  
  for (field in c("ownership", "facing")) {
    if (!is_empty_value(property[[field]])) {
      choices <- if (field == "ownership") c("Freehold", "Leasehold", "Co-operative Society", "Power Of Attorney") else
        c("East", "West", "North", "South", "NorthEast", "NorthWest", "SouthEast", "SouthWest")
      key <- function(x) gsub("[^a-z]", "", tolower(x))
      match <- match(key(as.character(property[[field]])), key(choices))
      if (is.na(match)) errors <- c(errors, paste("Unsupported", field, "category.")) else property[[field]] <- choices[[match]]
    }
  }
  missing_fields <- unique(missing_fields)
  
  ready_for_prediction <- (
    length(missing_fields) == 0 &&
      length(errors) == 0
  )
  
  
  # ------------------------------------------
  # 8. Update extracted property information
  # ------------------------------------------
  
  property$missing_fields <- missing_fields
  
  property$ready_for_prediction <- ready_for_prediction
  
  
  # ------------------------------------------
  # 9. Return validation result
  # ------------------------------------------
  
  return(
    list(
      valid = length(errors) == 0,
      ready_for_prediction = ready_for_prediction,
      missing_fields = missing_fields,
      errors = errors,
      data = property
    )
  )
  
}
