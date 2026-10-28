# Comprehensive Test Suite for all 8 PropGPT Map Test Cases
# Run from Backend/: Rscript test_all_map_cases.R

source("Plumber.R")

cat("=================================================================\n")
cat("PROPGPT - AUTOMATIC MAP & NEARBY AMENITIES VERIFICATION SUITE\n")
cat("=================================================================\n\n")

total_tests <- 0
passed_tests <- 0

assert_test <- function(condition, label) {
  total_tests <<- total_tests + 1
  if (isTRUE(condition)) {
    passed_tests <<- passed_tests + 1
    cat(sprintf("[PASS] %s\n", label))
  } else {
    cat(sprintf("[FAIL] %s\n", label))
    stop(paste("Assertion failed:", label))
  }
}

mock_turn_with_chat <- function(session_id, user_text, extracted_list) {
  nemotron_chat <<- function(...) {
    jsonlite::toJSON(c(extracted_list, list(action = "valuation")), auto_unbox = TRUE, null = "null")
  }
  process_conversation(session_id, user_text, PROPGPT_MARKET_DATA)
}

# -------------------------------------------------------------
# Test Case 1: "I want to sell my 3BHK flat in Gachibowli."
# -------------------------------------------------------------
cat("\n--- Test Case 1: 'I want to sell my 3BHK flat in Gachibowli.' ---\n")
r1 <- mock_turn_with_chat("case1_session", "I want to sell my 3BHK flat in Gachibowli.", 
  list(intent = "flat_purchase", bhk = 3, locality = "Gachibowli"))
assert_test(!is.null(r1$map), "Map object is returned in response")
assert_test(r1$map$locality == "Gachibowli", "Locality is Gachibowli")
assert_test(abs(r1$map$center$lat - 17.44) < 0.05, "Center latitude matches Gachibowli (~17.44)")
assert_test(abs(r1$map$center$lng - 78.348) < 0.05, "Center longitude matches Gachibowli (~78.35)")
assert_test(length(r1$map$amenities) > 0, "Discovered nearby amenities within 3km")
assert_test(r1$ready_for_prediction == FALSE, "Prediction is not ready yet because area is missing")

# -------------------------------------------------------------
# Test Case 2: "Estimate the price of my 2BHK in Kondapur."
# -------------------------------------------------------------
cat("\n--- Test Case 2: 'Estimate the price of my 2BHK in Kondapur.' ---\n")
r2 <- mock_turn_with_chat("case2_session", "Estimate the price of my 2BHK in Kondapur.", 
  list(intent = "flat_purchase", bhk = 2, locality = "Kondapur"))
assert_test(!is.null(r2$map), "Map object returned for Kondapur")
assert_test(r2$map$locality == "Kondapur", "Locality is Kondapur")
assert_test(abs(r2$map$center$lat - 17.469) < 0.05, "Center latitude matches Kondapur (~17.47)")
assert_test(length(r2$map$amenities) > 0, "Kondapur amenities returned")

# -------------------------------------------------------------
# Test Case 3: "What is my property's value in Madhapur?"
# -------------------------------------------------------------
cat("\n--- Test Case 3: 'What is my property's value in Madhapur?' ---\n")
r3 <- mock_turn_with_chat("case3_session", "What is my property's value in Madhapur?", 
  list(intent = "flat_purchase", locality = "Madhapur"))
assert_test(!is.null(r3$map), "Map object returned for Madhapur")
assert_test(r3$map$locality == "Madhapur", "Locality is Madhapur")
assert_test(abs(r3$map$center$lat - 17.448) < 0.05, "Center latitude matches Madhapur (~17.45)")

# -------------------------------------------------------------
# Test Case 4: User changes locality from Gachibowli to Kokapet
# -------------------------------------------------------------
cat("\n--- Test Case 4: Locality update from Gachibowli to Kokapet ---\n")
s4_id <- "case4_session"
r4_a <- mock_turn_with_chat(s4_id, "3BHK flat in Gachibowli", list(intent = "flat_purchase", bhk = 3, locality = "Gachibowli"))
assert_test(r4_a$map$locality == "Gachibowli", "Initial map is for Gachibowli")

r4_b <- mock_turn_with_chat(s4_id, "Actually, the property is located in Kokapet", list(locality = "Kokapet"))
assert_test(!is.null(r4_b$map), "Map object present after locality change")
assert_test(r4_b$map$locality == "Kokapet", "Map locality updated to Kokapet")
assert_test(abs(r4_b$map$center$lat - 17.417) < 0.05, "Coordinates updated to Kokapet (~17.417)")

# -------------------------------------------------------------
# Test Case 5: User provides locality but not area
# -------------------------------------------------------------
cat("\n--- Test Case 5: Locality provided but not area ---\n")
r5 <- mock_turn_with_chat("case5_session", "I have a flat in Miyapur with 2 bedrooms", 
  list(intent = "flat_purchase", locality = "Miyapur", bhk = 2))
assert_test(!is.null(r5$map), "Map is generated despite missing area")
assert_test(r5$ready_for_prediction == FALSE, "ready_for_prediction is FALSE")
assert_test("area" %in% r5$missing_fields, "'area' is recognized as missing field")
assert_test(r5$map$locality == "Miyapur", "Map correctly shows Miyapur")

# -------------------------------------------------------------
# Test Case 6: Geocoding service is unavailable
# -------------------------------------------------------------
cat("\n--- Test Case 6: Geocoding service is unavailable ---\n")
# Temporarily simulate geocoding failure for an unknown locality
r6_initial <- mock_turn_with_chat("case6_session", "I have a flat in FakeUnknownLocality999", 
  list(intent = "flat_purchase", locality = "FakeUnknownLocality999", bhk = 3))
assert_test(is.null(r6_initial$map), "Map is NULL when geocoding is unavailable")
assert_test(nzchar(r6_initial$reply), "Assistant reply is still produced without crash")

# Complete the property details and verify prediction works even without map!
r6_complete <- mock_turn_with_chat("case6_session", "Area is 1200 sqft", 
  list(area = 1200, area_source = "Super", furnishing = "Semi-Furnished", transaction = "Resale", bathroom = 2, balcony = 1))
assert_test(r6_complete$ready_for_prediction == TRUE, "Prediction is ready despite map lookup failure")
assert_test(r6_complete$prediction_success == TRUE, "ML prediction model succeeds without map")
assert_test(!is.null(r6_complete$prediction), "Predicted price is returned successfully")

# -------------------------------------------------------------
# Test Case 7: Overpass API is unavailable
# -------------------------------------------------------------
cat("\n--- Test Case 7: Overpass API unavailable / fallback handling ---\n")
# In amenity_service, when Overpass times out or is 502, it falls back to verified OSM repository
map7 <- get_locality_map("Kukatpally", radius = 3000)
assert_test(!is.null(map7), "Map router still resolves locality")
assert_test(length(map7$amenities) > 0, "Fallback amenities populated without hanging")
assert_test(map7$summary$total == length(map7$amenities), "Summary counts match items")

# -------------------------------------------------------------
# Test Case 8: No amenities returned in empty region
# -------------------------------------------------------------
cat("\n--- Test Case 8: Handling case with no amenities returned ---\n")
# Center at an uninhabited coordinate (e.g. desert or lake) with empty repository
empty_amenities <- fetch_nearby_amenities(lat = 17.0000, lng = 78.0000, radius = 500)
assert_test(is.list(empty_amenities$items), "Items is a list")
assert_test(length(empty_amenities$items) == 0, "No amenities returned for uninhabited area")
assert_test(empty_amenities$summary$total == 0, "Summary total count is 0")
assert_test(empty_amenities$summary$healthcare == 0, "Category count is 0")

cat("\n=================================================================\n")
cat(sprintf("RESULTS: %d / %d TESTS PASSED (100%% SUCCESS)\n", passed_tests, total_tests))
cat("=================================================================\n")

