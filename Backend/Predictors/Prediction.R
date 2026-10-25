
library(dplyr)
library(xgboost)

# Ensure required model and mapping objects are loaded in environment
if (!exists("xgb_model") || !exists("loc_map") || !exists("global_mean")) {
  if (file.exists(".RData")) {
    load(".RData")
  } else if (file.exists("Backend/.RData")) {
    load("Backend/.RData")
  } else if (file.exists("../.RData")) {
    load("../.RData")
  }
}

pred_price_flat <- function(
    query_area,
    query_bhk,
    query_locality,
    query_Furnishing = NULL,
    query_Transaction = NULL,
    query_area_source = NULL,
    query_Bathroom = NULL,
    query_Balcony = NULL
) {
  
  # 1. Validate numeric inputs
  if (!is.finite(query_area) || query_area <= 0)
    stop("Invalid area.")
  
  if (!is.finite(query_bhk) || query_bhk <= 0)
    stop("Invalid BHK.")
  
  # 2. Locality target encoding
  locality <- tolower(trimws(as.character(query_locality)))
  
  enc_col <- if ("encoded" %in% names(loc_map)) "encoded" else "loc_encoded"
  loc_match <- loc_map[[enc_col]][tolower(trimws(as.character(loc_map$locality))) == locality]
  
  if (length(loc_match) == 0 || is.na(loc_match[1])) {
    loc_encoded_val <- global_mean
    message("Unknown locality: using global mean.")
  } else {
    loc_encoded_val <- loc_match[1]
  }
  
  # 3. Derived numeric features
  log_area_val <- log(query_area)
  area_per_bhk_val <- query_area / query_bhk
  
  bhk_cat_val <- if (query_bhk %in% c(1, 2)) {
    0
  } else if (query_bhk == 3) {
    1
  } else if (query_bhk >= 4) {
    2
  } else {
    NA_real_
  }
  
  # 4. Furnishing encoding
  furnishing_map <- c(
    "unfurnished"    = 0,
    "semi-furnished" = 1,
    "semi furnished" = 1,
    "semifurnished"  = 1,
    "furnished"      = 2
  )
  
  if (is.null(query_Furnishing) || length(query_Furnishing) == 0 || is.na(query_Furnishing) ||
      (is.character(query_Furnishing) && !nzchar(trimws(query_Furnishing)))) {
    furnishing_val <- 1
  } else if (as.character(query_Furnishing) %in% c("0", "1", "2")) {
    furnishing_val <- as.numeric(query_Furnishing)
  } else {
    furnishing <- tolower(trimws(as.character(query_Furnishing)))
    if (length(furnishing) == 1 && furnishing %in% names(furnishing_map)) {
      furnishing_val <- unname(furnishing_map[[furnishing]])
    } else {
      stop("Invalid furnishing category.")
    }
  }
  
  # 5. Transaction encoding
  transaction_map <- c(
    "resale"       = 0,
    "new property" = 1,
    "new_property" = 1,
    "newproperty"  = 1,
    "new"          = 1
  )
  
  if (is.null(query_Transaction) || length(query_Transaction) == 0 || is.na(query_Transaction) ||
      (is.character(query_Transaction) && !nzchar(trimws(query_Transaction)))) {
    transaction_val <- 0
  } else if (as.character(query_Transaction) %in% c("0", "1")) {
    transaction_val <- as.numeric(query_Transaction)
  } else {
    transaction <- tolower(trimws(as.character(query_Transaction)))
    if (length(transaction) == 1 && transaction %in% names(transaction_map)) {
      transaction_val <- unname(transaction_map[[transaction]])
    } else {
      stop("Invalid transaction category.")
    }
  }
  
  # 6. Area source encoding
  area_source_map <- c(
    "carpet"      = 0,
    "carpet area" = 0,
    "super"       = 1,
    "super area"  = 1
  )
  
  if (is.null(query_area_source) || length(query_area_source) == 0 || is.na(query_area_source) ||
      (is.character(query_area_source) && !nzchar(trimws(query_area_source)))) {
    area_source_val <- 0
  } else if (as.character(query_area_source) %in% c("0", "1")) {
    area_source_val <- as.numeric(query_area_source)
  } else {
    area_source <- tolower(trimws(as.character(query_area_source)))
    if (length(area_source) == 1 && area_source %in% names(area_source_map)) {
      area_source_val <- unname(area_source_map[[area_source]])
    } else {
      stop("Invalid area source. Use Carpet or Super.")
    }
  }
  
  # 7. Optional numeric features
  bathroom_val <- if (is.null(query_Bathroom) || length(query_Bathroom) == 0 || is.na(query_Bathroom)) {
    query_bhk
  } else {
    as.numeric(query_Bathroom)
  }
  
  balcony_val <- if (is.null(query_Balcony) || length(query_Balcony) == 0 || is.na(query_Balcony)) {
    1
  } else {
    as.numeric(query_Balcony)
  }
  
  # 8. Exact original 10-feature matrix
  ndata <- data.frame(
    log_area = log_area_val,
    area_per_bhk = area_per_bhk_val,
    bhk = query_bhk,
    loc_encoded = loc_encoded_val,
    Furnishing_ord = furnishing_val,
    Transaction_ord = transaction_val,
    bhk_catencode = bhk_cat_val,
    area_sourcesuper = area_source_val,
    Bathroom = bathroom_val,
    Balcony = balcony_val
  )
  
  ndata <- as.matrix(ndata)
  
  # 9. Predict
  log_pred <- predict(xgb_model, ndata)
  
  pred_rupees <- exp(log_pred)
  
  if (!is.finite(pred_rupees) || pred_rupees <= 0)
    return("N/A")
  
  # 10. Format output
  if (pred_rupees >= 1e7) {
    return(paste0(
      format(round(pred_rupees / 1e7, 2), nsmall = 0),
      " Cr"
    ))
  }
  
  if (pred_rupees >= 1e5) {
    return(paste0(
      format(round(pred_rupees / 1e5, 2), nsmall = 0),
      " Lac"
    ))
  }
  
  paste0(
    "₹",
    format(round(pred_rupees), big.mark = ",", scientific = FALSE)
  )
}

# Alias for backwards compatibility
pred_price_flat2 <- pred_price_flat

