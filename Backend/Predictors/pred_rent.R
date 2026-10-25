library(stringr)
library(dplyr)
library(ranger)
pred_rent <- function(
    query_area,
    query_bhk,
    query_locality,
    query_furnishing   = NULL,
    query_area_source  = NULL,
    query_bathroom     = NULL,
    query_balcony      = NULL,
    query_buy_floor    = NULL,
    query_total_floors = NULL,
    model = rf_model4
) {
  
  # ============================================================
  # ROBUST LOCALITY LOOKUP — handles case/space/column-name issues
  # ============================================================
  q_loc <- str_to_lower(str_trim(as.character(query_locality)))
  
  # detect which encoded column exists in loc_map4
  enc_col <- if ("loc_encoded" %in% names(loc_map4)) {
    "loc_encoded"
  } else if ("encoded" %in% names(loc_map4)) {
    "encoded"
  } else {
    stop("loc_map4 has no 'loc_encoded' or 'encoded' column. Columns: ",
         paste(names(loc_map4), collapse = ", "))
  }
  
  # normalize locality column regardless of type
  loc_match <- loc_map4 |>
    mutate(.key = str_to_lower(str_trim(as.character(locality)))) |>
    filter(.key == q_loc)
  
  if (nrow(loc_match) == 0) {
    cat("⚠️  Locality '", query_locality, "' not found — using global mean\n", sep = "")
    loc_encoded_val <- global_mean4
    locality_n_val  <- 0L
  } else {
    loc_encoded_val <- loc_match[[enc_col]][1]
    locality_n_val  <- if ("locality_n" %in% names(loc_match)) loc_match$locality_n[1] else 0L
    
    if (is.na(loc_encoded_val)) {
      cat("⚠️  Locality '", query_locality, "' has NA encoding — using global mean\n", sep = "")
      loc_encoded_val <- global_mean4
      locality_n_val  <- 0L
    }
  }
  
  # ============================================================
  # Smart defaults
  # ============================================================
  furnishing_val   <- if (is.null(query_furnishing))   "Semi-Furnished"   else query_furnishing
  area_source_val  <- if (is.null(query_area_source))  "Carpet"           else query_area_source
  bathroom_val     <- if (is.null(query_bathroom))     query_bhk          else query_bathroom
  balcony_val      <- if (is.null(query_balcony))      1L                 else query_balcony
  buy_floor_val    <- if (is.null(query_buy_floor))    3L                 else query_buy_floor
  total_floors_val <- if (is.null(query_total_floors)) 5L                 else query_total_floors
  floor_ratio_val  <- buy_floor_val / total_floors_val
  
  facing_val       <- "East"
  tenant_val       <- "Bachelors/Family"
  availability_val <- "Immediately"
  
  # ============================================================
  # Derived features
  # ============================================================
  log_area_val     <- log(query_area)
  area_per_bhk_val <- query_area / query_bhk
  
  bhk_cat_val <- case_when(
    query_bhk == 1 ~ 0L,
    query_bhk == 2 ~ 1L,
    query_bhk >= 3 ~ 2L,
    TRUE           ~ 1L
  )
  
  # ============================================================
  # One-hot dummies
  # ============================================================
  furn_semi_val <- as.integer(furnishing_val == "Semi-Furnished")
  furn_full_val <- as.integer(furnishing_val == "Furnished")
  furn_unk_val  <- as.integer(furnishing_val == "Unknown")
  
  area_super_val <- as.integer(area_source_val == "Super")
  
  facing_west_val  <- as.integer(facing_val == "West")
  facing_north_val <- as.integer(facing_val == "North")
  facing_south_val <- as.integer(facing_val == "South")
  facing_ne_val    <- as.integer(facing_val == "NorthEast")
  facing_nw_val    <- as.integer(facing_val == "NorthWest")
  facing_se_val    <- as.integer(facing_val == "SouthEast")
  facing_sw_val    <- as.integer(facing_val == "SouthWest")
  facing_unk_val   <- as.integer(facing_val == "Unknown")
  
  tenant_bach_val <- as.integer(tenant_val == "Bachelors")
  tenant_fam_val  <- as.integer(tenant_val == "Family")
  tenant_unk_val  <- as.integer(tenant_val == "Unknown")
  
  avail_future_val <- as.integer(availability_val == "Future")
  avail_unk_val    <- as.integer(availability_val == "Unknown")
  
  # ============================================================
  # Build dataframe
  # ============================================================
  ndata <- data.frame(
    log_area                  = log_area_val,
    area_per_bhk              = area_per_bhk_val,
    bhk                       = query_bhk,
    bhk_catencode             = bhk_cat_val,
    loc_encoded               = loc_encoded_val,
    locality_n                = locality_n_val,
    Bathroom                  = bathroom_val,
    Balcony                   = balcony_val,
    buy_floor                 = buy_floor_val,
    total_floors              = total_floors_val,
    floor_ratio               = floor_ratio_val,
    area_sourceSuper          = area_super_val,
    FurnishingSemi_Furnished  = furn_semi_val,
    FurnishingFurnished       = furn_full_val,
    FurnishingUnknown         = furn_unk_val,
    facing_cleanWest          = facing_west_val,
    facing_cleanNorth         = facing_north_val,
    facing_cleanSouth         = facing_south_val,
    facing_cleanNorthEast     = facing_ne_val,
    facing_cleanNorthWest     = facing_nw_val,
    facing_cleanSouthEast     = facing_se_val,
    facing_cleanSouthWest     = facing_sw_val,
    facing_cleanUnknown       = facing_unk_val,
    Tenant.PreferredBachelors = tenant_bach_val,
    Tenant.PreferredFamily    = tenant_fam_val,
    Tenant.PreferredUnknown   = tenant_unk_val,
    Availability_cleanFuture  = avail_future_val,
    Availability_cleanUnknown = avail_unk_val,
    overlook_pool             = 0L,
    overlook_garden           = 0L,
    overlook_road             = 0L,
    overlook_na               = 1L,
    Bathroom_na               = 0L,
    Balcony_na                = 0L,
    buy_floor_na              = 0L,
    total_floors_na           = 0L,
    facing_na                 = 0L,
    locality_na               = 0L,
    check.names               = FALSE
  )
  
  # ============================================================
  # Align to pred_vars4
  # ============================================================
  keep <- intersect(names(ndata), pred_vars4)
  ndata <- ndata[, keep, drop = FALSE]
  
  missing_cols <- setdiff(pred_vars4, names(ndata))
  if (length(missing_cols) > 0) {
    for (m in missing_cols) ndata[[m]] <- 0
  }
  ndata <- ndata[, pred_vars4, drop = FALSE]
  
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
  # Format INR
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
