# Integration test for Automatic Property Maps in Conversation.R
# Run from Backend/: Rscript test_conversation_map.R

source("Plumber.R")

cat("--- Running Conversation Map Integration Tests ---\n\n")

# Mock Nemotron extraction helper
mock_turn <- function(session_id, user_text, mock_extracted) {
  nemotron_chat <<- function(...) {
    jsonlite::toJSON(c(mock_extracted, list(action = "valuation")), auto_unbox = TRUE, null = "null")
  }
  process_conversation(session_id, user_text, PROPGPT_MARKET_DATA)
}

# Test Case 1: Initial message has locality & BHK, but missing area
# Expected: Assistant asks for area, but map is ALREADY generated for Gachibowli!
cat("Test 1: Map generated on first turn when locality is known (even if area is missing)... ")
r1 <- mock_turn(
  session_id = "test_map_session_1",
  user_text = "I want to sell my 3BHK flat in Gachibowli.",
  mock_extracted = list(intent = "flat_purchase", bhk = 3, locality = "Gachibowli")
)

stopifnot(isFALSE(r1$ready_for_prediction))
stopifnot("area" %in% r1$missing_fields)
stopifnot(!is.null(r1$map))
stopifnot(r1$map$locality == "Gachibowli")
stopifnot(abs(r1$map$center$lat - 17.4400) < 0.05)
stopifnot(length(r1$map$amenities) > 0)
cat("PASS (map present for Gachibowli with", length(r1$map$amenities), "amenities, stage:", r1$conversation_state$stage, ")\n")

# Test Case 2: User provides area in turn 2
# Expected: Map is retained/reused without crashing
cat("Test 2: Second turn providing area reuses cached map... ")
r2 <- mock_turn(
  session_id = "test_map_session_1",
  user_text = "Area is 1450 sqft",
  mock_extracted = list(area = 1450, area_unit = "sqft")
)

stopifnot(!is.null(r2$map))
stopifnot(r2$map$locality == "Gachibowli")
cat("PASS (map preserved for", r2$map$locality, ")\n")

# Test Case 3: User changes locality to Kokapet
# Expected: Map updates automatically to Kokapet!
cat("Test 3: Changing locality updates map to new location... ")
r3 <- mock_turn(
  session_id = "test_map_session_1",
  user_text = "Actually the flat is in Kokapet",
  mock_extracted = list(locality = "Kokapet")
)

stopifnot(!is.null(r3$map))
stopifnot(r3$map$locality == "Kokapet")
stopifnot(abs(r3$map$center$lat - 17.4172) < 0.05)
cat("PASS (map dynamically updated to Kokapet, lat:", r3$map$center$lat, ")\n")

# Test Case 4: Locality is missing
# Expected: No map generated, map is NULL, no errors thrown
cat("Test 4: Missing locality produces NULL map safely... ")
r4 <- mock_turn(
  session_id = "test_map_no_loc",
  user_text = "I have a 2BHK flat with 1000 sqft",
  mock_extracted = list(intent = "flat_purchase", bhk = 2, area = 1000)
)
stopifnot(is.null(r4$map))
cat("PASS (map is NULL when locality unknown)\n")

cat("\nALL CONVERSATION MAP INTEGRATION TESTS PASSED!\n")

