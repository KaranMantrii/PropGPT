# Geospatial module verification test
# Run from Backend/: Rscript test_geospatial.R

source("geospatial/map_router.R")

cat("--- Running Geospatial Service Unit Tests ---\n\n")

# Test 1: Geocode Gachibowli
cat("Test 1: Geocode Gachibowli... ")
geo1 <- geocode_locality("Gachibowli")
stopifnot(!is.null(geo1))
stopifnot(is.numeric(geo1$lat) && is.numeric(geo1$lng))
stopifnot(abs(geo1$lat - 17.44) < 0.05)
cat("PASS (lat:", geo1$lat, "lng:", geo1$lng, ")\n")

# Test 2: Haversine distance
cat("Test 2: Haversine formula calculation... ")
# Distance between (17.4401, 78.3489) and (17.4422, 78.3587) is approx 1070 meters
d <- haversine_distance_m(17.4401, 78.3489, 17.4422, 78.3587)
stopifnot(!is.na(d) && d > 900 && d < 1200)
cat("PASS (calculated distance:", d, "meters)\n")

# Test 3: Fetch amenities for Gachibowli
cat("Test 3: Nearby amenities retrieval (radius = 3000m)... ")
map_res <- get_locality_map("Gachibowli", radius = 3000)
stopifnot(!is.null(map_res))
stopifnot(map_res$locality == "Gachibowli")
stopifnot(is.list(map_res$center) && is.numeric(map_res$center$lat))
stopifnot(length(map_res$amenities) > 0)
stopifnot(map_res$summary$total == length(map_res$amenities))
cat("PASS (found", map_res$summary$total, "amenities - Healthcare:", map_res$summary$healthcare, 
    "Education:", map_res$summary$education, "Transport:", map_res$summary$transportation, 
    "Shopping:", map_res$summary$shopping, "Recreation:", map_res$summary$recreation, ")\n")

# Test 4: Distance sorting
cat("Test 4: Amenities distance sorting... ")
dists <- vapply(map_res$amenities, function(x) x$distance_m, numeric(1))
stopifnot(all(diff(dists) >= 0))
cat("PASS (closest amenity is", map_res$amenities[[1]]$name, "at", dists[1], "m)\n")

# Test 5: Locality without coordinates / invalid locality returns NULL gracefully
cat("Test 5: Invalid/empty locality error isolation... ")
stopifnot(is.null(get_locality_map("")))
stopifnot(is.null(get_locality_map(NULL)))
stopifnot(is.null(get_locality_map("NonExistentXYZPlace123456789")))
cat("PASS (returns NULL cleanly without error)\n")

# Test 6: Verify other key localities
localities_to_test <- c("Kondapur", "Madhapur", "Kokapet", "Miyapur", "Kukatpally")
for (loc in localities_to_test) {
  cat("Test 6+:", loc, "... ")
  m <- get_locality_map(loc, radius = 3000)
  stopifnot(!is.null(m))
  stopifnot(!is.null(m$center$lat))
  cat("PASS (", length(m$amenities), "amenities )\n")
}

cat("\nALL GEOSPATIAL TESTS PASSED SUCCESSFULLY!\n")

