# Geospatial Service - Map Router Module
# Coordinates geocoding and amenity retrieval for PropGPT conversations.
# Provides complete error isolation and resilient fallbacks.

# Resolve current script directory to source peer modules reliably
.geospatial_dir <- tryCatch({
  d <- getSrcDirectory(function(x) x)
  if (length(d) == 1 && nzchar(d)) d else NULL
}, error = function(e) NULL)

if (is.null(.geospatial_dir)) {
  .geospatial_dir <- if (dir.exists("geospatial")) "geospatial" else if (dir.exists("Backend/geospatial")) "Backend/geospatial" else "."
}

source(file.path(.geospatial_dir, "geocoding.R"))
source(file.path(.geospatial_dir, "amenity_service.R"))

#' Retrieve comprehensive map and nearby amenities for a given locality
#'
#' @param locality Locality name (e.g. "Gachibowli", "Kokapet")
#' @param radius Search radius in meters (default 3000m)
#' @param force_refresh Logical, whether to bypass in-memory caches
#' @return A structured list containing locality center, boundingbox, amenities, and summary, or NULL if resolution fails.
get_locality_map <- function(locality, radius = 3000, force_refresh = FALSE) {
  if (is.null(locality) || !is.character(locality) || length(locality) != 1) {
    return(NULL)
  }
  
  clean_locality <- trimws(locality)
  if (!nzchar(clean_locality)) return(NULL)
  
  tryCatch({
    # 1. Geocode locality into coordinates
    geo <- geocode_locality(clean_locality, force_refresh = force_refresh)
    if (is.null(geo) || is.null(geo$lat) || is.null(geo$lng)) {
      message("Geocoding unresolvable for: ", clean_locality)
      return(NULL)
    }
    
    # 2. Fetch nearby amenities within specified radius
    amenity_result <- fetch_nearby_amenities(
      lat = geo$lat,
      lng = geo$lng,
      radius = radius,
      locality = geo$locality,
      force_refresh = force_refresh
    )
    
    # 3. Assemble structured map object for JSON serialization
    list(
      locality = geo$locality,
      display_name = geo$display_name,
      center = list(
        lat = geo$lat,
        lng = geo$lng
      ),
      boundingbox = geo$boundingbox,
      radius = as.numeric(radius),
      amenities = if (!is.null(amenity_result$items)) amenity_result$items else list(),
      summary = if (!is.null(amenity_result$summary)) amenity_result$summary else list(
        total = 0, healthcare = 0, education = 0, transportation = 0, shopping = 0, recreation = 0
      )
    )
    
  }, error = function(e) {
    message("Error in get_locality_map for '", clean_locality, "': ", conditionMessage(e))
    NULL
  })
}
