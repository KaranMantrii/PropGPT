# ============================================================
# PropGPT - Unified Market Intelligence Router
# Loads the three independent intelligence modules and routes
# flat / house / rental requests to the correct dataset.
#
# This file does NOT call or modify pred_price_flat(),
# pred_house(), or pred_rent().
# ============================================================

# Run this after setting the project working directory to backend/.

initialize_market_intelligence <- function(
    flat_path = "Datasets\\flat.csv",
    house_path = "Datasets\\house.csv",
    rent_path = "Datasets\\rental.csv",
    module_dir = "market_intelligence") {

  module_files <- c(
    file.path(module_dir, "flat_intelligence.R"),
    file.path(module_dir, "house_intelligence.R"),
    file.path(module_dir, "rent_intelligence.R")
  )

  missing_modules <- module_files[!file.exists(module_files)]
  if (length(missing_modules) > 0) {
    stop("Market intelligence module(s) not found: ",
         paste(missing_modules, collapse = ", "))
  }

  # Load function definitions into the current backend environment.
  for (file in module_files) source(file, local = .GlobalEnv)

  # Load datasets once at backend startup, not on every /chat request.
  list(
    flat = load_flat_intelligence_data(flat_path),
    house = load_house_intelligence_data(house_path),
    rent = load_rent_intelligence_data(rent_path),
    initialized_at = Sys.time()
  )
}

.market_normalize_intent <- function(intent) {
  intent <- tolower(trimws(as.character(intent)[1]))
  aliases <- c(
    flat = "flat", flats = "flat", apartment = "flat",
    apartments = "flat", flat_purchase = "flat", buy_flat = "flat",
    house = "house", independent_house = "house",
    house_purchase = "house", buy_house = "house",
    rent = "rent", rental = "rent", renting = "rent",
    flat_rent = "rent", house_rent = "rent"
  )
  if (is.na(intent) || !intent %in% names(aliases)) return(NA_character_)
  unname(aliases[[intent]])
}

# property must contain: locality, bhk, area, area_source.
# For purchase assessments, optionally pass quoted_price.
# For rental assessments, optionally pass quoted_rent.
get_market_context <- function(intent, property, market_data,
                               min_comparables = 5,
                               max_results = 8) {
  type <- .market_normalize_intent(intent)
  if (is.na(type)) {
    return(list(status = "unsupported_intent",
                message = "Market intelligence supports flat, house, and rent intents."))
  }

  required <- c("locality", "bhk", "area", "area_source")
  missing <- required[!vapply(required, function(x) {
    !is.null(property[[x]]) && length(property[[x]]) == 1 &&
      !is.na(property[[x]]) && nzchar(trimws(as.character(property[[x]])))
  }, logical(1))]

  if (length(missing) > 0) {
    return(list(status = "insufficient_property_details",
                missing_fields = missing,
                message = paste("Missing market comparison fields:",
                                paste(missing, collapse = ", "))))
  }

  locality <- as.character(property$locality)
  bhk <- as.numeric(property$bhk)
  area <- as.numeric(property$area)
  area_source <- as.character(property$area_source)

  if (!is.finite(bhk) || bhk <= 0 || !is.finite(area) || area <= 0) {
    return(list(status = "invalid_property_details",
                message = "BHK and area must be positive numeric values."))
  }

  if (is.null(market_data[[type]])) {
    return(list(status = "dataset_unavailable",
                message = paste("No loaded dataset for intent:", type)))
  }

  data <- market_data[[type]]

  tryCatch({
    if (type == "flat") {
      locality_stats <- get_flat_locality_stats(
        data, locality, bhk = bhk, area_source = area_source)
      comparables <- find_comparable_flats(
        data, locality, bhk, area, area_source,
        min_comparables = min_comparables, max_results = max_results)
      quote_value <- property$quoted_price
      assessment <- if (!is.null(quote_value) && length(quote_value) == 1 &&
                         !is.na(quote_value) && is.finite(as.numeric(quote_value)) &&
                         as.numeric(quote_value) > 0) {
        assess_flat_quote(data, locality, bhk, area,
                          as.numeric(quote_value), area_source,
                          min_comparables = min_comparables,
                          max_results = max_results)
      } else NULL

    } else if (type == "house") {
      locality_stats <- get_house_locality_stats(
        data, locality, bhk = bhk, area_source = area_source)
      comparables <- find_comparable_houses(
        data, locality, bhk, area, area_source,
        min_comparables = min_comparables, max_results = max_results)
      quote_value <- property$quoted_price
      assessment <- if (!is.null(quote_value) && length(quote_value) == 1 &&
                         !is.na(quote_value) && is.finite(as.numeric(quote_value)) &&
                         as.numeric(quote_value) > 0) {
        assess_house_quote(data, locality, bhk, area,
                           as.numeric(quote_value), area_source,
                           min_comparables = min_comparables,
                           max_results = max_results)
      } else NULL

    } else {
      locality_stats <- get_rent_locality_stats(
        data, locality, bhk = bhk, area_source = area_source)
      comparables <- find_comparable_rentals(
        data, locality, bhk, area, area_source,
        min_comparables = min_comparables, max_results = max_results)
      quote_value <- property$quoted_rent
      assessment <- if (!is.null(quote_value) && length(quote_value) == 1 &&
                         !is.na(quote_value) && is.finite(as.numeric(quote_value)) &&
                         as.numeric(quote_value) > 0) {
        assess_rent_quote(data, locality, bhk, area,
                          as.numeric(quote_value), area_source,
                          min_comparables = min_comparables,
                          max_results = max_results)
      } else NULL
    }

    list(
      status = "success",
      intent = type,
      property = list(locality = tolower(trimws(locality)),
                      bhk = bhk, area = area,
                      area_source = area_source),
      locality_statistics = locality_stats,
      comparable_count = nrow(comparables),
      comparables = comparables,
      quote_assessment = assessment,
      evidence_note = if (type == "rent") {
        "Comparisons are based on observed rental listings, not verified final rents."
      } else {
        "Comparisons are based on observed asking prices, not verified sale transactions."
      }
    )
  }, error = function(e) {
    list(status = "error", intent = type,
         message = conditionMessage(e))
  })
}

market_intelligence_health <- function(market_data) {
  data.frame(
    dataset = c("flat", "house", "rent"),
    loaded = c(!is.null(market_data$flat),
               !is.null(market_data$house),
               !is.null(market_data$rent)),
    records = c(if (is.null(market_data$flat)) 0 else nrow(market_data$flat),
                if (is.null(market_data$house)) 0 else nrow(market_data$house),
                if (is.null(market_data$rent)) 0 else nrow(market_data$rent)),
    stringsAsFactors = FALSE
  )
}
