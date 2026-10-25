
# ==========================================
# PropGPT - Category Normalization
# File: backend/services/category_normalization.R
# ==========================================


normalize_furnishing <- function(value) {
  
  # Missing optional value
  if (is.null(value) || length(value) == 0 || is.na(value)) {
    return(NULL)
  }
  
  # Normalize text
  value <- tolower(trimws(as.character(value)))
  
  if (!nzchar(value) || value %in% c("null", "none", "unknown", "n/a", "na", "not specified", "not provided", "skip", "any", "undefined")) {
    return(NULL)
  }
  
  # Fully furnished variations
  furnished_values <- c(
    "furnished",
    "fully furnished",
    "fully-furnished",
    "full furnished",
    "full-furnished"
  )
  
  # Semi-furnished variations
  semi_furnished_values <- c(
    "semi furnished",
    "semi-furnished",
    "semifurnished",
    "partially furnished",
    "part furnished",
    "part-furnished"
  )
  
  # Unfurnished variations
  unfurnished_values <- c(
    "unfurnished",
    "un furnished",
    "not furnished",
    "without furniture",
    "no furniture"
  )
  
  if (value %in% furnished_values) {
    
    return("Furnished")
    
  } else if (value %in% semi_furnished_values) {
    
    return("Semi-Furnished")
    
  } else if (value %in% unfurnished_values) {
    
    return("Unfurnished")
    
  } else {
    
    stop(
      paste("Unsupported furnishing category:", value)
    )
    
  }
  
}


normalize_transaction <- function(value) {
  
  if (is.null(value) || length(value) == 0 || is.na(value)) {
    return(NULL)
  }
  
  value <- tolower(trimws(as.character(value)))
  
  if (!nzchar(value) || value %in% c("null", "none", "unknown", "n/a", "na", "not specified", "not provided", "skip", "any", "undefined")) {
    return(NULL)
  }
  
  new_property_values <- c(
    "new property",
    "new_property",
    "newproperty",
    "new",
    "new booking",
    "under construction"
  )
  
  resale_values <- c(
    "resale",
    "re-sale",
    "pre-owned",
    "second hand"
  )
  
  if (value %in% new_property_values) {
    return("New Property")
  } else if (value %in% resale_values) {
    return("Resale")
  } else {
    stop(paste("Unsupported transaction category:", value))
  }
}


normalize_area_source <- function(value) {
  
  if (is.null(value) || length(value) == 0 || is.na(value)) {
    return(NULL)
  }
  
  value <- tolower(trimws(as.character(value)))
  
  if (!nzchar(value) || value %in% c("null", "none", "unknown", "n/a", "na", "not specified", "not provided", "skip", "any", "undefined")) {
    return(NULL)
  }
  
  carpet_values <- c(
    "carpet",
    "carpet area",
    "carpet_area"
  )
  
  super_values <- c(
    "super",
    "super area",
    "super built-up",
    "super built-up area",
    "super builtup",
    "super_area",
    "built-up",
    "builtup"
  )
  
  if (value %in% carpet_values) {
    return("Carpet")
  } else if (value %in% super_values) {
    return("Super")
  } else {
    stop(paste("Unsupported area source:", value))
  }
}

