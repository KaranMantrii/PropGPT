# Geospatial Service - Geocoding Module
# Resolves property localities to geographic coordinates via OpenStreetMap Nominatim.
# Includes memory caching and Hyderabad contextual disambiguation.

suppressPackageStartupMessages({
  library(jsonlite)
})

# In-memory cache for geocoded localities
PROPGPT_GEOCODE_CACHE <- new.env(parent = emptyenv())

# Pre-seed verified OpenStreetMap coordinates for primary Hyderabad micro-markets
# to eliminate network latency, avoid public rate-limiting, and ensure deterministic tests.
.seed_primary_hyderabad_localities <- function() {
  primary_seeds <- list(
    "gachibowli" = list(
      locality = "Gachibowli",
      lat = 17.4400813,
      lng = 78.3489168,
      display_name = "Gachibowli, Serilingampalle mandal, Hyderabad, Telangana, 500032, India",
      boundingbox = c(17.4200, 17.4650, 78.3280, 78.3720)
    ),
    "kondapur" = list(
      locality = "Kondapur",
      lat = 17.4698602,
      lng = 78.3578254,
      display_name = "Kondapur, Serilingampalle mandal, Hyderabad, Telangana, 500084, India",
      boundingbox = c(17.4500, 17.4880, 78.3400, 78.3750)
    ),
    "madhapur" = list(
      locality = "Madhapur",
      lat = 17.4482937,
      lng = 78.3914851,
      display_name = "Madhapur, Serilingampalle mandal, Hyderabad, Telangana, 500081, India",
      boundingbox = c(17.4300, 17.4680, 78.3750, 78.4100)
    ),
    "kokapet" = list(
      locality = "Kokapet",
      lat = 17.4172450,
      lng = 78.3308320,
      display_name = "Kokapet, Gandipet mandal, Hyderabad, Ranga Reddy, Telangana, 500075, India",
      boundingbox = c(17.3980, 17.4350, 78.3120, 78.3500)
    ),
    "miyapur" = list(
      locality = "Miyapur",
      lat = 17.4967765,
      lng = 78.3568478,
      display_name = "Miyapur, Serilingampalle mandal, Hyderabad, Telangana, 500049, India",
      boundingbox = c(17.4780, 17.5150, 78.3380, 78.3750)
    ),
    "kukatpally" = list(
      locality = "Kukatpally",
      lat = 17.4849206,
      lng = 78.4138297,
      display_name = "Kukatpally, Medchal-Malkajgiri, Hyderabad, Telangana, 500072, India",
      boundingbox = c(17.4650, 17.5050, 78.3950, 78.4350)
    ),
    "financial district" = list(
      locality = "Financial District",
      lat = 17.4170300,
      lng = 78.3444000,
      display_name = "Financial District, Nanakramguda, Hyderabad, Telangana, 500032, India",
      boundingbox = c(17.4020, 17.4320, 78.3300, 78.3600)
    ),
    "manikonda" = list(
      locality = "Manikonda",
      lat = 17.3995120,
      lng = 78.3794150,
      display_name = "Manikonda, Gandipet mandal, Hyderabad, Ranga Reddy, Telangana, 500089, India",
      boundingbox = c(17.3820, 17.4180, 78.3620, 78.3980)
    ),
    "tellapur" = list(
      locality = "Tellapur",
      lat = 17.4627100,
      lng = 78.2936200,
      display_name = "Tellapur, Ramachandrapuram mandal, Sangareddy, Telangana, 502032, India",
      boundingbox = c(17.4450, 17.4820, 78.2750, 78.3120)
    ),
    "nallagandla" = list(
      locality = "Nallagandla",
      lat = 17.4725000,
      lng = 78.3150000,
      display_name = "Nallagandla, Serilingampalle mandal, Hyderabad, Telangana, 500019, India",
      boundingbox = c(17.4550, 17.4900, 78.2980, 78.3320)
    ),
    "hitec city" = list(
      locality = "HITEC City",
      lat = 17.4474120,
      lng = 78.3762300,
      display_name = "HITEC City, Madhapur, Hyderabad, Telangana, 500081, India",
      boundingbox = c(17.4320, 17.4620, 78.3610, 78.3910)
    ),
    "jubilee hills" = list(
      locality = "Jubilee Hills",
      lat = 17.4319400,
      lng = 78.4073300,
      display_name = "Jubilee Hills, Hyderabad, Telangana, 500033, India",
      boundingbox = c(17.4150, 17.4500, 78.3900, 78.4250)
    ),
    "banjara hills" = list(
      locality = "Banjara Hills",
      lat = 17.4156000,
      lng = 78.4357000,
      display_name = "Banjara Hills, Hyderabad, Telangana, 500034, India",
      boundingbox = c(17.3980, 17.4320, 78.4180, 78.4520)
    ),
    "begumpet" = list(
      locality = "Begumpet",
      lat = 17.4447000,
      lng = 78.4664000,
      display_name = "Begumpet, Hyderabad, Telangana, 500016, India",
      boundingbox = c(17.4280, 17.4620, 78.4500, 78.4820)
    )
  )

  for (key in names(primary_seeds)) {
    PROPGPT_GEOCODE_CACHE[[key]] <- primary_seeds[[key]]
  }
}

.seed_primary_hyderabad_localities()

#' Normalize a locality key for cache lookup
.normalize_locality_key <- function(locality) {
  if (is.null(locality) || !is.character(locality) || length(locality) != 1) return("")
  key <- tolower(trimws(locality))
  # Remove trailing/leading punctuation
  key <- gsub("^[^a-z0-9]+|[^a-z0-9]+$", "", key)
  key
}

#' Geocode a locality name to geographic coordinates
#'
#' @param locality Character string of the locality name (e.g. "Gachibowli")
#' @param force_refresh Logical, whether to bypass the in-memory cache
#' @param city_context Character string, default "Hyderabad, Telangana, India"
#' @return A list with locality, lat, lng, display_name, boundingbox, or NULL if resolution fails.
geocode_locality <- function(locality, force_refresh = FALSE, city_context = "Hyderabad, Telangana, India") {
  if (is.null(locality) || !is.character(locality) || length(locality) != 1) {
    return(NULL)
  }
  
  clean_locality <- trimws(locality)
  if (!nzchar(clean_locality)) return(NULL)
  
  cache_key <- .normalize_locality_key(clean_locality)
  
  # Check cache first
  if (!force_refresh && exists(cache_key, envir = PROPGPT_GEOCODE_CACHE, inherits = FALSE)) {
    cached <- PROPGPT_GEOCODE_CACHE[[cache_key]]
    return(cached)
  }
  
  # Configure endpoint & user agent
  nominatim_url <- Sys.getenv("NOMINATIM_URL", "https://nominatim.openstreetmap.org/search")
  user_agent <- Sys.getenv("GEOCODING_USER_AGENT", "PropGPT-RealEstate-Platform/1.0 (academic-research-hyderabad)")
  
  # Disambiguation with city context
  query_str <- clean_locality
  if (!grepl("hyderabad", query_str, ignore.case = TRUE)) {
    query_str <- paste0(query_str, ", ", city_context)
  }
  
  encoded_query <- curl::curl_escape(query_str)
  req_url <- paste0(nominatim_url, "?q=", encoded_query, "&format=json&addressdetails=1&limit=1")
  
  result <- tryCatch({
    h <- curl::new_handle(timeout = 6)
    curl::handle_setheaders(h, "User-Agent" = user_agent, "Accept" = "application/json")
    
    resp <- curl::curl_fetch_memory(req_url, handle = h)
    
    if (resp$status_code != 200) {
      message("Nominatim HTTP ", resp$status_code, " for locality: ", clean_locality)
      return(NULL)
    }
    
    parsed <- jsonlite::fromJSON(rawToChar(resp$content), simplifyVector = FALSE)
    if (length(parsed) == 0) {
      message("No Nominatim results for locality: ", clean_locality)
      return(NULL)
    }
    
    item <- parsed[[1]]
    lat <- suppressWarnings(as.numeric(item$lat))
    lng <- suppressWarnings(as.numeric(item$lon))
    
    if (is.na(lat) || is.na(lng)) return(NULL)
    
    bbox <- if (!is.null(item$boundingbox)) {
      suppressWarnings(as.numeric(unlist(item$boundingbox)))
    } else {
      c(lat - 0.025, lat + 0.025, lng - 0.025, lng + 0.025)
    }
    
    record <- list(
      locality = clean_locality,
      lat = lat,
      lng = lng,
      display_name = if (!is.null(item$display_name)) item$display_name else clean_locality,
      boundingbox = bbox
    )
    
    # Cache valid resolution
    PROPGPT_GEOCODE_CACHE[[cache_key]] <- record
    record
    
  }, error = function(e) {
    message("Geocoding exception for '", clean_locality, "': ", conditionMessage(e))
    NULL
  })
  
  result
}

