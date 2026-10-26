
# ==========================================
# PropGPT - Prediction Router
# File: backend/services/prediction_router.R
# ==========================================


# Safely retrieve optional property fields
get_optional_field <- function(property, field) {
  
  value <- property[[field]]
  
  if (is.null(value) || length(value) == 0) {
    return(NULL)
  }
  
  if (is.character(value) && !nzchar(trimws(value))) {
    return(NULL)
  }
  
  if (length(value) == 1 && is.atomic(value) && is.na(value)) {
    return(NULL)
  }
  
  value
}


# ------------------------------------------
# Main prediction router
# ------------------------------------------

resolve_prediction_defaults <- function(property) {
  defaults <- list(furnishing = "Semi-Furnished", transaction = "Resale", area_source = "Carpet",
    bathroom = property$bhk, balcony = 1)
  if (property$intent == "rent") defaults$transaction <- NULL
  if (property$intent %in% c("house_purchase", "rent")) defaults <- c(defaults, list(buy_floor = 3, total_floors = 5))
  if (property$intent == "house_purchase") defaults <- c(defaults, list(ownership = "Freehold", facing = "East"))
  assumed <- character(0)
  labels <- c(furnishing = "Furnishing", transaction = "Transaction", area_source = "Area basis", bathroom = "Bathrooms",
    balcony = "Balconies", buy_floor = "Property floor", total_floors = "Total floors", ownership = "Ownership", facing = "Facing")
  for (field in names(defaults)) {
    if (is_empty_value(property[[field]])) {
      property[[field]] <- defaults[[field]]
      assumed <- c(assumed, paste0(labels[[field]], ": ", defaults[[field]]))
    }
  }
  property$assumptions <- assumed
  property
}

route_prediction <- function(property) {
  
  # ----------------------------------------
  # 1. Basic checks
  # ----------------------------------------
  
  if (!is.list(property)) {
    stop("Property data must be an R list.")
  }
  
  required_fields <- c(
    "intent",
    "area",
    "bhk",
    "locality"
  )
  
  for (field in required_fields) {
    
    if (is_empty_value(property[[field]])) {
      stop(paste("Missing required field:", field))
    }
    
  }
  
  if (!isTRUE(property$ready_for_prediction)) {
    stop("Property has not passed validation.")
  }
  property <- resolve_prediction_defaults(property)
  
  # All predictors expect area in square feet.
  area <- as.numeric(property$area)
  
  if (!is.finite(area) || area <= 0) {
    stop("Invalid property area.")
  }
  
  intent <- tolower(trimws(as.character(property$intent)))
  
  bhk <- as.numeric(property$bhk)
  
  locality <- trimws(as.character(property$locality))
  
  
  # ----------------------------------------
  # 2. Route to the correct predictor
  # ----------------------------------------
  
  prediction <- switch(
    
    intent = intent,
    
    # ======================================
    # FLAT PURCHASE
    # ======================================
    
    flat_purchase = {
      
      pred_price_flat(
        
        query_area = area,
        query_bhk = bhk,
        query_locality = locality,
        
        query_Furnishing =
          get_optional_field(property, "furnishing"),
        
        query_Transaction =
          get_optional_field(property, "transaction"),
        
        query_area_source =
          get_optional_field(property, "area_source"),
        
        query_Bathroom =
          get_optional_field(property, "bathroom"),
        
        query_Balcony =
          get_optional_field(property, "balcony")
        
      )
      
    },
    
    
    # ======================================
    # INDEPENDENT HOUSE PURCHASE
    # ======================================
    
    house_purchase = {
      
      pred_house(
        
        query_area = area,
        query_bhk = bhk,
        query_locality = locality,
        
        query_furnishing =
          get_optional_field(property, "furnishing"),
        
        query_area_source =
          get_optional_field(property, "area_source"),
        
        query_transaction =
          get_optional_field(property, "transaction"),
        
        query_bathroom =
          get_optional_field(property, "bathroom"),
        
        query_balcony =
          get_optional_field(property, "balcony"),
        
        query_ownership =
          get_optional_field(property, "ownership"),
        
        query_facing =
          get_optional_field(property, "facing"),
        
        query_buy_floor =
          get_optional_field(property, "buy_floor"),
        
        query_total_floors =
          get_optional_field(property, "total_floors")
        
      )
      
    },
    
    
    # ======================================
    # RENT
    # ======================================
    
    rent = {
      
      pred_rent(
        
        query_area = area,
        query_bhk = bhk,
        query_locality = locality,
        
        query_furnishing =
          get_optional_field(property, "furnishing"),
        
        query_area_source =
          get_optional_field(property, "area_source"),
        
        query_bathroom =
          get_optional_field(property, "bathroom"),
        
        query_balcony =
          get_optional_field(property, "balcony"),
        
        query_buy_floor =
          get_optional_field(property, "buy_floor"),
        
        query_total_floors =
          get_optional_field(property, "total_floors")
        
      )
      
    },
    
    
    # ======================================
    # INVALID INTENT
    # ======================================
    
    stop(
      paste("Unsupported prediction intent:", intent)
    )
    
  )
  
  
  # ----------------------------------------
  # 3. Return a consistent response
  # ----------------------------------------
  
  return(
    list(
      
      success = TRUE,
      
      intent = intent,
      
      prediction = prediction,
      
      property = property
      
    )
  )
  
}

