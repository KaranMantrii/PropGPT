# ============================================================
# PropGPT - Rental Market Intelligence
# ============================================================

.rent_normalize_area_source <- function(x) tolower(trimws(as.character(x)))

# ---- 1. Load and validate the rental dataset ----------------

load_rent_intelligence_data <- function(path = "Datasets\\rental.csv") {
  if (!file.exists(path)) {
    stop("Rental dataset not found at: ", path)
  }

  data <- utils::read.csv(path, stringsAsFactors = FALSE,
                          check.names = FALSE)

  required_cols <- c(
    "bhk", "area_source", "Furnishing", "Bathroom",
    "Tenant.Preferred", "Balcony", "price_num", "area",
    "locality", "total_floors", "buy_floor", "floor_na",
    "facing_clean", "Availability_clean", "overlook_pool",
    "overlook_garden", "overlook_road"
  )

  missing_cols <- setdiff(required_cols, names(data))
  if (length(missing_cols) > 0) {
    stop("Rental dataset is missing required columns: ",
         paste(missing_cols, collapse = ", "))
  }

  # Remove an exported row-index column if present.
  data <- data[, !(is.na(names(data)) | !nzchar(trimws(names(data))) | grepl("^Unnamed(:|\\.)", names(data))), drop = FALSE]

  numeric_cols <- c("bhk", "Bathroom", "Balcony", "price_num", "area",
                    "total_floors", "buy_floor", "overlook_pool",
                    "overlook_garden", "overlook_road")
  for (col in intersect(numeric_cols, names(data))) {
    data[[col]] <- suppressWarnings(as.numeric(data[[col]]))
  }

  data$locality <- tolower(trimws(as.character(data$locality)))
  data$area_source <- .rent_normalize_area_source(data$area_source)
  data$Furnishing <- trimws(as.character(data$Furnishing))

  # Retain rows usable for rent and area comparisons.
  valid <- !is.na(data$price_num) & is.finite(data$price_num) & data$price_num > 0 &
    !is.na(data$area) & is.finite(data$area) & data$area > 0 &
    !is.na(data$bhk) & is.finite(data$bhk) & data$bhk > 0 &
    !is.na(data$locality) & nzchar(data$locality) &
    !is.na(data$area_source) & nzchar(data$area_source)

  data <- data[valid, , drop = FALSE]
  rownames(data) <- NULL

  if (nrow(data) == 0) {
    stop("No valid rental records remain after validation.")
  }

  data$rent_per_sqft <- data$price_num / data$area
  data
}

# ---- 2. Small internal helpers ------------------------------

.rent_normalize_locality <- function(x) {
  tolower(trimws(as.character(x)))
}


.rent_safe_median <- function(x) {
  x <- x[is.finite(x)]
  if (length(x) == 0) return(NA_real_)
  stats::median(x)
}

.rent_summary <- function(data) {
  if (nrow(data) == 0) return(NULL)

  data.frame(
    listings = nrow(data),
    median_rent = stats::median(data$price_num),
    mean_rent = mean(data$price_num),
    min_rent = min(data$price_num),
    q1_rent = as.numeric(stats::quantile(data$price_num, 0.25, names = FALSE)),
    q3_rent = as.numeric(stats::quantile(data$price_num, 0.75, names = FALSE)),
    max_rent = max(data$price_num),
    median_area = stats::median(data$area),
    median_rent_per_sqft = .rent_safe_median(data$rent_per_sqft),
    stringsAsFactors = FALSE
  )
}

# ---- 3. Locality-level rental statistics --------------------

get_rent_locality_stats <- function(data, locality,
                                    bhk = NULL,
                                    area_source = NULL,
                                    min_listings = 1) {
  if (missing(locality) || length(locality) != 1 || is.na(locality) ||
      !nzchar(trimws(locality))) {
    stop("Provide one valid locality name.")
  }

  locality_key <- .rent_normalize_locality(locality)
  subset_data <- data[data$locality == locality_key, , drop = FALSE]

  if (!is.null(bhk)) {
    subset_data <- subset_data[subset_data$bhk == as.numeric(bhk), , drop = FALSE]
  }
  if (!is.null(area_source)) {
    subset_data <- subset_data[.rent_normalize_area_source(subset_data$area_source) == .rent_normalize_area_source(area_source), , drop = FALSE]
  }

  if (nrow(subset_data) < min_listings) return(NULL)

  result <- .rent_summary(subset_data)
  result$locality <- locality_key
  if (!is.null(bhk)) result$bhk <- as.numeric(bhk)
  if (!is.null(area_source)) result$area_source <- .rent_normalize_area_source(area_source)

  result[, c("locality", intersect(c("bhk", "area_source"), names(result)),
             setdiff(names(result), c("locality", "bhk", "area_source"))),
         drop = FALSE]
}

# ---- 4. BHK-wise rent statistics ----------------------------

get_rent_bhk_stats <- function(data, locality = NULL,
                               area_source = NULL,
                               min_listings = 1) {
  subset_data <- data

  if (!is.null(locality)) {
    locality_key <- .rent_normalize_locality(locality)
    subset_data <- subset_data[subset_data$locality == locality_key, , drop = FALSE]
  }
  if (!is.null(area_source)) {
    subset_data <- subset_data[.rent_normalize_area_source(subset_data$area_source) == .rent_normalize_area_source(area_source), , drop = FALSE]
  }

  if (nrow(subset_data) == 0) return(data.frame())

  groups <- split(subset_data, subset_data$bhk)
  rows <- lapply(names(groups), function(key) {
    group <- groups[[key]]
    if (nrow(group) < min_listings) return(NULL)
    cbind(data.frame(bhk = as.numeric(key)), .rent_summary(group))
  })

  rows <- Filter(Negate(is.null), rows)
  if (length(rows) == 0) return(data.frame())
  result <- do.call(rbind, rows)
  rownames(result) <- NULL
  result[order(result$bhk), , drop = FALSE]
}

# ---- 5. Find comparable rental listings ---------------------

find_comparable_rentals <- function(data, locality, bhk, area,
                                    area_source,
                                    area_tolerance = 0.30,
                                    min_comparables = 5,
                                    max_results = 10) {
  if (length(area) != 1 || is.na(area) || area <= 0) {
    stop("area must be one positive numeric value.")
  }
  if (length(bhk) != 1 || is.na(bhk) || bhk <= 0) {
    stop("bhk must be one positive numeric value.")
  }
  if (area_tolerance < 0 || area_tolerance > 1) {
    stop("area_tolerance must be between 0 and 1.")
  }

  locality_key <- .rent_normalize_locality(locality)
  same_locality <- data[data$locality == locality_key &
                          data$bhk == as.numeric(bhk) &
                          .rent_normalize_area_source(data$area_source) == .rent_normalize_area_source(area_source), , drop = FALSE]

  # Start with the requested area band, then widen it gradually.
  tolerances <- unique(c(area_tolerance, 0.40, 0.50, 0.65, 0.80, 1.00))
  selected <- same_locality[0, , drop = FALSE]
  used_tolerance <- NA_real_

  for (tol in tolerances) {
    candidate <- same_locality[
      same_locality$area >= area * (1 - tol) &
        same_locality$area <= area * (1 + tol), , drop = FALSE
    ]
    selected <- candidate
    used_tolerance <- tol
    if (nrow(candidate) >= min_comparables) break
  }

  # If locality has too few records, widen geography but retain BHK
  # and area-source consistency. Mark these as broader-area matches.
  match_scope <- "same_locality"
  if (nrow(selected) < min_comparables) {
    broader <- data[data$bhk == as.numeric(bhk) &
                      .rent_normalize_area_source(data$area_source) == .rent_normalize_area_source(area_source) &
                      data$area >= area * (1 - used_tolerance) &
                      data$area <= area * (1 + used_tolerance), , drop = FALSE]
    selected <- broader
    match_scope <- "other_localities_same_bhk_area_source"
  }

  if (nrow(selected) == 0) return(data.frame())

  selected$area_difference_pct <- abs(selected$area - area) / area * 100
  selected$rent_difference_pct_from_median <- NA_real_
  selected <- selected[order(selected$area_difference_pct), , drop = FALSE]
  selected <- utils::head(selected, max_results)
  selected$match_scope <- match_scope
  selected$area_tolerance_used <- used_tolerance
  rownames(selected) <- NULL
  selected
}

# ---- 6. Assess a quoted monthly rent ------------------------

assess_rent_quote <- function(data, locality, bhk, area,
                              quoted_rent, area_source,
                              area_tolerance = 0.30,
                              min_comparables = 5,
                              max_results = 10) {
  if (length(quoted_rent) != 1 || is.na(quoted_rent) || quoted_rent <= 0) {
    stop("quoted_rent must be one positive numeric value.")
  }

  comparables <- find_comparable_rentals(
    data = data,
    locality = locality,
    bhk = bhk,
    area = area,
    area_source = area_source,
    area_tolerance = area_tolerance,
    min_comparables = min_comparables,
    max_results = max_results
  )

  if (nrow(comparables) == 0) {
    return(list(
      status = "insufficient_data",
      message = "No suitable comparable rental listings were found.",
      quoted_rent = quoted_rent,
      comparables = data.frame()
    ))
  }

  rents <- comparables$price_num
  median_rent <- stats::median(rents)
  q1 <- as.numeric(stats::quantile(rents, 0.25, names = FALSE))
  q3 <- as.numeric(stats::quantile(rents, 0.75, names = FALSE))
  difference_pct <- (quoted_rent - median_rent) / median_rent * 100

  assessment <- if (quoted_rent < q1) {
    "below_observed_range"
  } else if (quoted_rent > q3) {
    "above_observed_range"
  } else {
    "within_observed_range"
  }

  summary <- data.frame(
    locality_requested = .rent_normalize_locality(locality),
    bhk = as.numeric(bhk),
    area = as.numeric(area),
    area_source = area_source,
    quoted_rent = as.numeric(quoted_rent),
    comparable_count = length(rents),
    comparable_median_rent = median_rent,
    comparable_q1_rent = q1,
    comparable_q3_rent = q3,
    quoted_vs_median_pct = difference_pct,
    assessment = assessment,
    match_scope = comparables$match_scope[1],
    stringsAsFactors = FALSE
  )

  list(
    status = "success",
    summary = summary,
    comparables = comparables,
    interpretation = switch(
      assessment,
      below_observed_range = "The quoted rent is below the middle 50% range of the selected comparable listings.",
      within_observed_range = "The quoted rent falls within the middle 50% range of the selected comparable listings.",
      above_observed_range = "The quoted rent is above the middle 50% range of the selected comparable listings."
    ),
    caveat = paste(
      "This assessment compares advertised/listed rents in the dataset;",
      "it does not establish the final negotiated rent or a verified market transaction."
    )
  )
}

# ---- 7. Optional quick diagnostic ---------------------------

rent_intelligence_overview <- function(data) {
  list(
    records = nrow(data),
    localities = length(unique(data$locality)),
    area_sources = sort(unique(data$area_source)),
    bhk_values = sort(unique(data$bhk)),
    overall_rent_summary = .rent_summary(data),
    top_localities_by_listing_count = utils::head(
      as.data.frame(sort(table(data$locality), decreasing = TRUE)), 10
    )
  )
}

