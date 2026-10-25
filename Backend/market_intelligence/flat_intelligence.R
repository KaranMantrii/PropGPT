# ============================================================
# PropGPT - Flat Purchase Market Intelligence

.flat_normalize_area_source <- function(x) tolower(trimws(as.character(x)))

# ---- 1. Load and validate the flat dataset ------------------

load_flat_intelligence_data <- function(path = "C:\\Users\\lenovo\\Downloads\\flat.csv") {
  if (!file.exists(path)) stop("Flat dataset not found at: ", path)

  data <- utils::read.csv(path, stringsAsFactors = FALSE,
                          check.names = FALSE)

  required_cols <- c("locality", "price_num", "ppsf", "bhk", "bhk_category",
                     "area", "area_source", "Bathroom", "Balcony",
                     "Furnishing", "Transaction", "facing")
  missing_cols <- setdiff(required_cols, names(data))
  if (length(missing_cols) > 0) {
    stop("Flat dataset is missing required columns: ",
         paste(missing_cols, collapse = ", "))
  }

  data <- data[, !(is.na(names(data)) | !nzchar(trimws(names(data))) | grepl("^Unnamed(:|\\.)", names(data))), drop = FALSE]

  numeric_cols <- c("price_num", "ppsf", "bhk", "area", "Bathroom", "Balcony")
  for (col in intersect(numeric_cols, names(data))) {
    data[[col]] <- suppressWarnings(as.numeric(data[[col]]))
  }

  data$locality <- tolower(trimws(as.character(data$locality)))
  data$area_source <- .flat_normalize_area_source(data$area_source)
  data$Furnishing <- trimws(as.character(data$Furnishing))
  data$Transaction <- trimws(as.character(data$Transaction))
  data$facing <- trimws(as.character(data$facing))

  valid <- !is.na(data$price_num) & is.finite(data$price_num) & data$price_num > 0 &
    !is.na(data$area) & is.finite(data$area) & data$area > 0 &
    !is.na(data$bhk) & data$bhk > 0 &
    !is.na(data$area_source) & nzchar(data$area_source)
  data <- data[valid, , drop = FALSE]
  data$ppsf_calculated <- data$price_num / data$area
  rownames(data) <- NULL

  if (nrow(data) == 0) stop("No valid flat records remain after validation.")
  data
}

# ---- 2. Internal helpers ------------------------------------

.flat_normalize_locality <- function(x) tolower(trimws(as.character(x)))


.flat_summary <- function(data) {
  if (nrow(data) == 0) return(NULL)
  data.frame(
    listings = nrow(data),
    median_price = stats::median(data$price_num),
    mean_price = mean(data$price_num),
    min_price = min(data$price_num),
    q1_price = as.numeric(stats::quantile(data$price_num, 0.25, names = FALSE)),
    q3_price = as.numeric(stats::quantile(data$price_num, 0.75, names = FALSE)),
    max_price = max(data$price_num),
    median_area = stats::median(data$area),
    median_price_per_sqft = stats::median(data$ppsf_calculated),
    stringsAsFactors = FALSE
  )
}

# ---- 3. Dataset overview ------------------------------------

flat_intelligence_overview <- function(data) {
  data.frame(
    valid_listings = nrow(data),
    localities = length(unique(data$locality[!is.na(data$locality) & nzchar(data$locality)])),
    bhk_categories = paste(sort(unique(data$bhk)), collapse = ", "),
    area_sources = paste(sort(unique(data$area_source)), collapse = ", "),
    missing_locality = sum(is.na(data$locality) | !nzchar(data$locality)),
    stringsAsFactors = FALSE
  )
}

# ---- 4. Locality-level flat statistics ----------------------

get_flat_locality_stats <- function(data, locality, bhk = NULL,
                                    area_source = NULL, min_listings = 1) {
  if (missing(locality) || length(locality) != 1 || is.na(locality) ||
      !nzchar(trimws(locality))) stop("Provide one valid locality name.")

  key <- .flat_normalize_locality(locality)
  subset_data <- data[!is.na(data$locality) & data$locality == key, , drop = FALSE]
  if (!is.null(bhk)) subset_data <- subset_data[subset_data$bhk == as.numeric(bhk), , drop = FALSE]
  if (!is.null(area_source)) subset_data <- subset_data[.flat_normalize_area_source(subset_data$area_source) == .flat_normalize_area_source(area_source), , drop = FALSE]
  if (nrow(subset_data) < min_listings) return(NULL)

  result <- .flat_summary(subset_data)
  result$locality <- key
  if (!is.null(bhk)) result$bhk <- as.numeric(bhk)
  if (!is.null(area_source)) result$area_source <- .flat_normalize_area_source(area_source)
  result[, c("locality", intersect(c("bhk", "area_source"), names(result)),
             setdiff(names(result), c("locality", "bhk", "area_source"))), drop = FALSE]
}

# ---- 5. BHK-wise purchase statistics -----------------------

get_flat_bhk_stats <- function(data, locality = NULL, area_source = NULL,
                               min_listings = 1) {
  subset_data <- data
  if (!is.null(locality)) {
    key <- .flat_normalize_locality(locality)
    subset_data <- subset_data[!is.na(subset_data$locality) & subset_data$locality == key, , drop = FALSE]
  }
  if (!is.null(area_source)) subset_data <- subset_data[.flat_normalize_area_source(subset_data$area_source) == .flat_normalize_area_source(area_source), , drop = FALSE]
  if (nrow(subset_data) == 0) return(data.frame())

  groups <- split(subset_data, subset_data$bhk)
  rows <- lapply(names(groups), function(key) {
    group <- groups[[key]]
    if (nrow(group) < min_listings) return(NULL)
    cbind(data.frame(bhk = as.numeric(key)), .flat_summary(group))
  })
  rows <- Filter(Negate(is.null), rows)
  if (length(rows) == 0) return(data.frame())
  result <- do.call(rbind, rows)
  rownames(result) <- NULL
  result[order(result$bhk), , drop = FALSE]
}

# ---- 6. Locality-wise price per sqft ------------------------

get_flat_locality_rankings <- function(data, bhk = NULL,
                                       area_source = NULL,
                                       min_listings = 5) {
  subset_data <- data[!is.na(data$locality) & nzchar(data$locality), , drop = FALSE]
  if (!is.null(bhk)) subset_data <- subset_data[subset_data$bhk == as.numeric(bhk), , drop = FALSE]
  if (!is.null(area_source)) subset_data <- subset_data[.flat_normalize_area_source(subset_data$area_source) == .flat_normalize_area_source(area_source), , drop = FALSE]
  if (nrow(subset_data) == 0) return(data.frame())

  groups <- split(subset_data, subset_data$locality)
  rows <- lapply(names(groups), function(key) {
    group <- groups[[key]]
    if (nrow(group) < min_listings) return(NULL)
    data.frame(locality = key, listings = nrow(group),
               median_price = median(group$price_num),
               median_price_per_sqft = median(group$ppsf_calculated),
               median_area = median(group$area), stringsAsFactors = FALSE)
  })
  rows <- Filter(Negate(is.null), rows)
  if (length(rows) == 0) return(data.frame())
  result <- do.call(rbind, rows)
  result <- result[order(result$median_price_per_sqft, decreasing = TRUE), , drop = FALSE]
  rownames(result) <- NULL
  result
}

# ---- 7. Find comparable flat listings -----------------------

find_comparable_flats <- function(data, locality, bhk, area, area_source,
                                  area_tolerance = 0.30,
                                  min_comparables = 5, max_results = 10) {
  if (length(area) != 1 || is.na(area) || area <= 0) stop("area must be positive.")
  if (length(bhk) != 1 || is.na(bhk) || bhk <= 0) stop("bhk must be positive.")
  if (area_tolerance < 0 || area_tolerance > 1) stop("area_tolerance must be between 0 and 1.")
  if (length(area_source) != 1 || is.na(area_source) || !nzchar(area_source)) {
    stop("Provide area_source as Carpet or Super (matching the dataset).")
  }

  locality_key <- .flat_normalize_locality(locality)
  base <- data[data$bhk == as.numeric(bhk) & .flat_normalize_area_source(data$area_source) == .flat_normalize_area_source(area_source), , drop = FALSE]
  same_locality <- base[!is.na(base$locality) & base$locality == locality_key, , drop = FALSE]

  tolerances <- unique(c(area_tolerance, 0.40, 0.50, 0.65, 0.80, 1.00))
  selected <- same_locality[0, , drop = FALSE]
  used_tolerance <- area_tolerance
  for (tol in tolerances) {
    candidate <- same_locality[same_locality$area >= area * (1 - tol) &
                                 same_locality$area <= area * (1 + tol), , drop = FALSE]
    selected <- candidate
    used_tolerance <- tol
    if (nrow(candidate) >= min_comparables) break
  }

  match_scope <- "same_locality"
  if (nrow(selected) < min_comparables) {
    selected <- base[base$area >= area * (1 - used_tolerance) &
                       base$area <= area * (1 + used_tolerance), , drop = FALSE]
    match_scope <- "other_localities_same_bhk_area_source"
  }
  if (nrow(selected) == 0) return(data.frame())

  selected$area_difference_pct <- abs(selected$area - area) / area * 100
  selected$price_difference_pct_from_median <- NA_real_
  selected <- selected[order(selected$area_difference_pct), , drop = FALSE]
  selected <- utils::head(selected, max_results)
  selected$match_scope <- match_scope
  selected$area_tolerance_used <- used_tolerance
  rownames(selected) <- NULL
  selected
}

# ---- 8. Assess a quoted purchase price ----------------------

assess_flat_quote <- function(data, locality, bhk, area, quoted_price,
                              area_source, area_tolerance = 0.30,
                              min_comparables = 5, max_results = 10) {
  if (length(quoted_price) != 1 || is.na(quoted_price) || quoted_price <= 0) {
    stop("quoted_price must be one positive numeric value in rupees.")
  }

  comparables <- find_comparable_flats(
    data, locality, bhk, area, area_source,
    area_tolerance, min_comparables, max_results
  )
  if (nrow(comparables) == 0) {
    return(list(status = "insufficient_data",
                message = "No suitable comparable flat listings were found.",
                quoted_price = quoted_price, comparables = data.frame()))
  }

  prices <- comparables$price_num
  median_price <- median(prices)
  q1 <- as.numeric(stats::quantile(prices, 0.25, names = FALSE))
  q3 <- as.numeric(stats::quantile(prices, 0.75, names = FALSE))
  difference_pct <- (quoted_price - median_price) / median_price * 100

  interpretation <- if (quoted_price < q1) {
    "Below the middle 50% range of selected asking-price comparables."
  } else if (quoted_price > q3) {
    "Above the middle 50% range of selected asking-price comparables."
  } else {
    "Within the middle 50% range of selected asking-price comparables."
  }

  list(
    status = "ok",
    locality = .flat_normalize_locality(locality),
    bhk = as.numeric(bhk),
    area = as.numeric(area),
    area_source = area_source,
    quoted_price = quoted_price,
    comparable_count = nrow(comparables),
    median_comparable_price = median_price,
    q1_comparable_price = q1,
    q3_comparable_price = q3,
    min_comparable_price = min(prices),
    max_comparable_price = max(prices),
    quoted_price_difference_pct = difference_pct,
    interpretation = interpretation,
    match_scope = unique(comparables$match_scope),
    comparables = comparables
  )
}
