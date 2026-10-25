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
  flat_path = "Datasets\\flat.csv",
  house_path = "Datasets\\house.csv",
  rent_path = "Datasets\\rental.csv",
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
  res$setHeader("Access-Control-Allow-Origin", "*")
  res$setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
  res$setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Accept, Origin, User-Agent")
  
  if (identical(req$REQUEST_METHOD, "OPTIONS")) {
    res$status <- 200
    return(list())
  }
  
  plumber::forward()
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
  
  body <- req$body
  
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
      details = err_msg
    ))
  }
  
  # 9. Successful response
  list(
    success = TRUE,
    prediction_type = "flat_price",
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
  
  body <- req$body
  
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
  
  body <- req$body
  
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
  
  body <- req$body
  
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
    !nzchar(trimws(session_id))
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
    !nzchar(trimws(user_message))
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
  
  result
  
}

