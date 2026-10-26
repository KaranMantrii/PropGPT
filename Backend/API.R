# Prefer project-local dependencies when installed alongside the repository.
if (dir.exists("../.r-library")) {
  .libPaths(c(normalizePath("../.r-library"), .libPaths()))
}

options(encoding = "UTF-8")
if (.Platform$OS.type == "windows") invisible(Sys.setlocale("LC_CTYPE", ".UTF-8"))

library(stringr)
library(plumber)

# ============================================================
# LOAD THE PLUMBER API
# ============================================================

api <- plumb("Plumber.R")
api$setSerializer(serializer_json(auto_unbox = TRUE, null = "null", na = "null"))

# Ensure CORS headers are attached on all unhandled errors (500) and 404s
# so the browser never masks errors as CORS rejections
api$setErrorHandler(function(req, res, err) {
  origin <- if (!is.null(req$HTTP_ORIGIN) && nzchar(req$HTTP_ORIGIN)) {
    req$HTTP_ORIGIN
  } else if (!is.null(req$HEADERS) && "origin" %in% names(req$HEADERS)) {
    req$HEADERS[["origin"]]
  } else {
    NULL
  }
  
  res$setHeader("Access-Control-Allow-Origin", if (!is.null(origin) && nzchar(origin)) origin else "*")
  res$setHeader("Access-Control-Allow-Credentials", "true")
  res$setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, HEAD")
  res$setHeader("Access-Control-Allow-Headers", "*")
  res$setHeader("Access-Control-Allow-Private-Network", "true")
  res$setHeader("Vary", "Origin")
  res$status <- 500
  
  list(
    error = "Internal server error",
    details = conditionMessage(err)
  )
})

api$set404Handler(function(req, res) {
  origin <- if (!is.null(req$HTTP_ORIGIN) && nzchar(req$HTTP_ORIGIN)) {
    req$HTTP_ORIGIN
  } else if (!is.null(req$HEADERS) && "origin" %in% names(req$HEADERS)) {
    req$HEADERS[["origin"]]
  } else {
    NULL
  }
  
  res$setHeader("Access-Control-Allow-Origin", if (!is.null(origin) && nzchar(origin)) origin else "*")
  res$setHeader("Access-Control-Allow-Credentials", "true")
  res$setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, HEAD")
  res$setHeader("Access-Control-Allow-Headers", "*")
  res$setHeader("Access-Control-Allow-Private-Network", "true")
  res$setHeader("Vary", "Origin")
  res$status <- 404
  
  list(error = "Endpoint not found")
})

# ============================================================
# OPENAPI / SWAGGER DOCUMENTATION
# ============================================================

api$setApiSpec(function(spec) {
  
  
  # ----------------------------------------------------------
  # FLAT PURCHASE PRICE
  # ----------------------------------------------------------
  
  spec$paths[["/predict/flat"]]$post$requestBody <- list(
    required = TRUE,
    content = list(
      "application/json" = list(
        schema = list(
          type = "object",
          required = c(
            "query_area",
            "query_bhk",
            "query_locality"
          ),
          properties = list(
            
            query_area = list(
              type = "number",
              example = 1500
            ),
            
            query_bhk = list(
              type = "integer",
              example = 3
            ),
            
            query_locality = list(
              type = "string",
              example = "Kokapet"
            ),
            
            query_Furnishing = list(
              type = "string",
              enum = c(
                "Unfurnished",
                "Semi-Furnished",
                "Furnished"
              ),
              example = "Semi-Furnished"
            ),
            
            query_Transaction = list(
              type = "string",
              enum = c(
                "Resale",
                "New Property"
              ),
              example = "Resale"
            ),
            
            query_area_source = list(
              type = "string",
              enum = c(
                "Carpet",
                "Super"
              ),
              example = "Carpet"
            ),
            
            query_Bathroom = list(
              type = "integer",
              example = 3
            ),
            
            query_Balcony = list(
              type = "integer",
              example = 2
            )
          )
        )
      )
    )
  )
  
  
  
  # ----------------------------------------------------------
  # HOUSE PURCHASE PRICE
  # ----------------------------------------------------------
  
  spec$paths[["/predict/house"]]$post$requestBody <- list(
    required = TRUE,
    content = list(
      "application/json" = list(
        schema = list(
          type = "object",
          required = c(
            "query_area",
            "query_bhk",
            "query_locality"
          ),
          properties = list(
            query_area = list(
              type = "number",
              example = 1800
            ),
            query_bhk = list(
              type = "integer",
              example = 3
            ),
            query_locality = list(
              type = "string",
              example = "Kukatpally"
            ),
            query_furnishing = list(
              type = "string",
              example = "Semi-Furnished"
            ),
            query_area_source = list(
              type = "string",
              example = "Carpet"
            ),
            query_transaction = list(
              type = "string",
              example = "Resale"
            ),
            query_bathroom = list(
              type = "integer",
              example = 3
            ),
            query_balcony = list(
              type = "integer",
              example = 2
            ),
            query_ownership = list(
              type = "string",
              example = "Freehold"
            ),
            query_facing = list(
              type = "string",
              example = "East"
            ),
            query_buy_floor = list(
              type = "integer",
              example = 3
            ),
            query_total_floors = list(
              type = "integer",
              example = 5
            )
          )
        )
      )
    )
  )
  
  
  # ----------------------------------------------------------
  # RENT PREDICTION
  # ----------------------------------------------------------
  
  spec$paths[["/predict/rent"]]$post$requestBody <- list(
    required = TRUE,
    content = list(
      "application/json" = list(
        schema = list(
          type = "object",
          required = c(
            "query_area",
            "query_bhk",
            "query_locality"
          ),
          properties = list(
            query_area = list(
              type = "number",
              example = 1200
            ),
            query_bhk = list(
              type = "integer",
              example = 2
            ),
            query_locality = list(
              type = "string",
              example = "Miyapur"
            ),
            query_furnishing = list(
              type = "string",
              example = "Semi-Furnished"
            ),
            query_area_source = list(
              type = "string",
              example = "Carpet"
            ),
            query_bathroom = list(
              type = "integer",
              example = 2
            ),
            query_balcony = list(
              type = "integer",
              example = 1
            ),
            query_buy_floor = list(
              type = "integer",
              example = 3
            ),
            query_total_floors = list(
              type = "integer",
              example = 5
            )
          )
        )
      )
    )
  )
  
  
  # ----------------------------------------------------------
  # CONVERSATIONAL PROPERTY PREDICTION
  # ----------------------------------------------------------
  
  spec$paths[["/chat"]]$post$requestBody <- list(
    required = TRUE,
    content = list(
      "application/json" = list(
        schema = list(
          type = "object",
          required = c(
            "session_id",
            "message"
          ),
          properties = list(
            session_id = list(
              type = "string",
              example = "user_session_001",
              description = "Unique conversation session identifier"
            ),
            message = list(
              type = "string",
              example = "I want to buy a 3 BHK flat in Kokapet with 1500 sqft",
              description = "User's natural language property query"
            )
          )
        )
      )
    )
  )
  
  
  # ----------------------------------------------------------
  # CHAT RESPONSE DOCUMENTATION
  # ----------------------------------------------------------
  
  spec$paths[["/chat"]]$post$responses <- list(
    
    "200" = list(
      description = "Conversation processed successfully",
      content = list(
        "application/json" = list(
          schema = list(
            type = "object",
            properties = list(
              session_id = list(type = "string"),
              reply = list(type = "string"),
              ready_for_prediction = list(type = "boolean"),
              prediction_success = list(type = "boolean"),
              prediction = list(type = "object"),
              intent = list(type = "string"),
              
              missing_fields = list(
                type = "array",
                items = list(type = "string")
              ),
              
              errors = list(
                type = "array",
                items = list(type = "string")
              ),
              
              prediction_error = list(type = "string"),
              market_context = list(type = "object"),
              market_error = list(type = "string"),
              property = list(type = "object")
            )
          )
        )
      )
    ),
    
    "400" = list(
      description = "Missing required request fields"
    ),
    
    "500" = list(
      description = "Internal server error"
    )
  )
  
  
  # Return modified specification
  spec
  
})


# ============================================================
# START API SERVER
# ============================================================

port <- as.numeric(Sys.getenv("PORT", "8000"))
api$run(
  host = Sys.getenv("HOST", "0.0.0.0"),
  port = port
)

