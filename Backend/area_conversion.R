

#  Area Conversion


# Standard conversion factor
SQYD_TO_SQFT <- 9


convert_area_to_sqft <- function(area, unit = "sqft") {
  
  # Validate area
  area <- suppressWarnings(as.numeric(area))
  
  if (
    length(area) != 1 ||
    is.na(area) ||
    !is.finite(area) ||
    area <= 0
  ) {
    stop("Area must be a valid positive number.")
  }
  
  # Normalize unit
  unit <- tolower(trimws(unit))
  
  # Square yards
  yard_units <- c(
    "sqyd",
    "sq yd",
    "sq. yd.",
    "sq yard",
    "sq yards",
    "square yard",
    "square yards",
    "yard",
    "yards"
  )
  
  # Square feet
  feet_units <- c(
    "sqft",
    "sq ft",
    "sq. ft.",
    "sq foot",
    "sq feet",
    "square foot",
    "square feet"
  )
  
  if (unit %in% yard_units) {
    
    converted_area <- area * SQYD_TO_SQFT
    
  } else if (unit %in% feet_units) {
    
    converted_area <- area
    
  } else {
    
    stop(
      paste("Unsupported area unit:", unit)
    )
    
  }
  
  return(
    list(
      original_area = area,
      original_unit = unit,
      area_sqft = converted_area,
      converted = unit %in% yard_units
    )
  )
  
}
