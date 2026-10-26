library(stringr)
library(dplyr)
library(ranger)

find_model_file <- function(filename) {
  candidates <- c(
    file.path("models", filename),
    file.path("Backend", "models", filename),
    file.path("..", "models", filename),
    file.path("..", "Backend", "models", filename)
  )
  found <- candidates[file.exists(candidates)]
  if (length(found) > 0) return(found[1])
  stop(paste("Model file not found:", filename))
}

if (!exists("rf_model3", envir = .GlobalEnv) || is.null(get("rf_model3", envir = .GlobalEnv))) {
  assign("rf_model3", readRDS(find_model_file("rf_model3.rds")), envir = .GlobalEnv)
}
if (!exists("loc_map_house", envir = .GlobalEnv) || is.null(get("loc_map_house", envir = .GlobalEnv))) {
  assign("loc_map_house", readRDS(find_model_file("loc_map_house.rds")), envir = .GlobalEnv)
}

# ============================================================
# HOUSE PRICE PREDICTOR — 3-input demo-style (suffix 3)
# ============================================================
pred_house <- function(
    query_area,
    query_bhk,
    query_locality,
    query_furnishing   = NULL,
    query_area_source  = NULL,   
    query_transaction  = NULL,   
    query_bathroom     = NULL,   
    query_balcony      = NULL,   
    query_ownership    = NULL,   
    query_facing       = NULL,   
    query_buy_floor    = NULL,
    query_total_floors = NULL,   
    model = rf_model3
) {
  
  # ============================================================
  # ROBUST LOCALITY LOOKUP (same pattern as pred_rent)
  # ============================================================
  q_loc <- str_to_lower(str_trim(as.character(query_locality)))
  
  # detect encoded column name in loc_map_house
  enc_col <- if ("loc_encoded" %in% names(loc_map_house)) {
    "loc_encoded"
  } else if ("encoded" %in% names(loc_map_house)) {
    "encoded"
  } else {
    stop("loc_map_house has no 'loc_encoded' or 'encoded' column. Columns: ",
         paste(names(loc_map_house), collapse = ", "))
  }
  
  loc_match <- loc_map_house |>
    mutate(.key = str_to_lower(str_trim(as.character(locality)))) |>
    filter(.key == q_loc)
  
  if (nrow(loc_match) == 0) {
    cat("⚠️  Locality '", query_locality, "' not found — using global mean\n", sep = "")
    loc_encoded_val <- global_mean3
    locality_n_val  <- 0L
  } else {
    loc_encoded_val <- loc_match[[enc_col]][1]
    locality_n_val  <- if ("locality_n" %in% names(loc_match)) loc_match$locality_n[1] else 0L
    
    if (is.na(loc_encoded_val)) {
      cat("⚠️  Locality '", query_locality, "' has NA encoding — using global mean\n", sep = "")
      loc_encoded_val <- global_mean3
      locality_n_val  <- 0L
    }
  }
  
  # ============================================================
  # Smart defaults
  # ============================================================
  furnishing_val   <- if (is.null(query_furnishing))   "Semi-Furnished"   else query_furnishing
  area_source_val  <- if (is.null(query_area_source))  "Carpet"           else query_area_source
  transaction_val  <- if (is.null(query_transaction))  "Resale"           else query_transaction
  bathroom_val     <- if (is.null(query_bathroom))     query_bhk          else query_bathroom
  balcony_val      <- if (is.null(query_balcony))      1L                 else query_balcony
  ownership_val    <- if (is.null(query_ownership))    "Freehold"         else query_ownership
  facing_val       <- if (is.null(query_facing))       "East"             else query_facing
  buy_floor_val    <- if (is.null(query_buy_floor))    3L                 else query_buy_floor
  total_floors_val <- if (is.null(query_total_floors)) 5L                 else query_total_floors
  
  # ============================================================
  # Derived features
  # ============================================================
  log_area_val     <- log(query_area)
  area_per_bhk_val <- query_area / query_bhk
  
  bhk_cat_val <- case_when(
    query_bhk == 1 ~ 0L,   # Compact
    query_bhk == 2 ~ 1L,   # Standard
    query_bhk >= 3 ~ 2L,   # Large
    TRUE           ~ 1L
  )
  
  floor_ratio_val <- buy_floor_val / total_floors_val
  
  # ============================================================
  # One-hot dummies
  # ============================================================
  # Transaction (reference = Resale)
  trxn_new_val <- as.integer(transaction_val == "New Property")
  trxn_unk_val <- as.integer(transaction_val == "Unknown")
  
  # area_source (reference = Carpet)
  area_super_val <- as.integer(area_source_val == "Super")
  area_unk_val   <- as.integer(area_source_val == "Unknown")
  
  # Furnishing (reference = Unfurnished)
  furn_semi_val <- as.integer(furnishing_val == "Semi-Furnished")
  furn_full_val <- as.integer(furnishing_val == "Furnished")
  furn_unk_val  <- as.integer(furnishing_val == "Unknown")
  
  # Ownership (reference = Freehold)
  own_lease_val <- as.integer(ownership_val == "Leasehold")
  own_coop_val  <- as.integer(ownership_val == "Co-operative Society")
  own_poa_val   <- as.integer(ownership_val == "Power Of Attorney")
  own_unk_val   <- as.integer(ownership_val == "Unknown")
  
  # facing (reference = East)
  facing_west_val  <- as.integer(facing_val == "West")
  facing_north_val <- as.integer(facing_val == "North")
  facing_south_val <- as.integer(facing_val == "South")
  facing_ne_val    <- as.integer(facing_val == "NorthEast")
  facing_nw_val    <- as.integer(facing_val == "NorthWest")
  facing_se_val    <- as.integer(facing_val == "SouthEast")
  facing_sw_val    <- as.integer(facing_val == "SouthWest")
  facing_unk_val   <- as.integer(facing_val == "Unknown")
  
  # ============================================================
  # Build dataframe
  # ============================================================
  ndata <- data.frame(
    log_area                    = log_area_val,
    area_per_bhk                = area_per_bhk_val,
    bhk                         = query_bhk,
    bhk_catencode               = bhk_cat_val,
    loc_encoded                 = loc_encoded_val,
    locality_n                  = locality_n_val,
    Bathroom                    = bathroom_val,
    Balcony                     = balcony_val,
    buy_floor                   = buy_floor_val,
    total_floors                = total_floors_val,
    floor_ratio                 = floor_ratio_val,
    Transaction_New_Property    = trxn_new_val,
    Transaction_Unknown         = trxn_unk_val,
    area_sourceSuper            = area_super_val,
    area_sourceUnknown          = area_unk_val,
    FurnishingSemi_Furnished    = furn_semi_val,
    FurnishingFurnished         = furn_full_val,
    FurnishingUnknown           = furn_unk_val,
    Ownership_Leasehold         = own_lease_val,
    `Ownership_Co-operative_Society` = own_coop_val,
    Ownership_Power_Of_Attorney = own_poa_val,
    Ownership_Unknown           = own_unk_val,
    facing_cleanWest            = facing_west_val,
    facing_cleanNorth           = facing_north_val,
    facing_cleanSouth           = facing_south_val,
    facing_cleanNorthEast       = facing_ne_val,
    facing_cleanNorthWest       = facing_nw_val,
    facing_cleanSouthEast       = facing_se_val,
    facing_cleanSouthWest       = facing_sw_val,
    facing_cleanUnknown         = facing_unk_val,
    Bathroom_na                 = 0L,
    Balcony_na                  = 0L,
    buy_floor_na                = 0L,
    total_floors_na             = 0L,
    facing_na                   = 0L,
    locality_na                 = 0L,
    check.names                 = FALSE
  )
  
  # ============================================================
  # Align to pred_vars3
  # ============================================================
  target_vars <- if (exists("pred_vars3", envir = .GlobalEnv)) {
    get("pred_vars3", envir = .GlobalEnv)
  } else if (!is.null(model$forest$independent.variable.names)) {
    model$forest$independent.variable.names
  } else {
    rf_model3$forest$independent.variable.names
  }

  keep <- intersect(names(ndata), target_vars)
  ndata <- ndata[, keep, drop = FALSE]
  
  missing_cols <- setdiff(target_vars, names(ndata))
  if (length(missing_cols) > 0) {
    for (m in missing_cols) ndata[[m]] <- 0
  }
  ndata <- ndata[, target_vars, drop = FALSE]
  
  # ============================================================
  # Predict
  # ============================================================
  log_pred <- if (inherits(model, "ranger")) {
    predict(model, data = ndata)$predictions
  } else if (inherits(model, "xgb.Booster")) {
    predict(model, as.matrix(ndata))
  } else if (inherits(model, "lm")) {
    as.numeric(predict(model, newdata = ndata))
  } else stop("Unsupported model type")
  
  pred_rupees <- exp(log_pred)
  
  # ============================================================
  # Format INR (same as pred_rent)
  # ============================================================
  format_inr <- function(price) {
    if (is.na(price) | price <= 0) return("N/A")
    if (price >= 1e7) {
      paste0(format(round(price / 1e7, 2), nsmall = 0), " Cr")
    } else if (price >= 1e5) {
      paste0(format(round(price / 1e5, 2), nsmall = 0), " Lac")
    } else {
      paste0("₹", format(round(price), big.mark = ",", scientific = FALSE))
    }
  }
  
  return(format_inr(pred_rupees))
}

