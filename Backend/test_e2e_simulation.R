# Test End-to-End Multi-Turn Conversational Workflow with Follow-up

readRenviron(".Renviron")
source("Plumber.R")

cat("\n==================================================\n")
cat("Starting PropGPT End-to-End Simulation Test\n")
cat("==================================================\n")

session_id <- paste0("test_sim_", format(Sys.time(), "%H%M%S"))

# Turn 1: Basic statement with missing required fields
cat("\n--- TURN 1: User says 'I want to buy a flat in Kukatpally' ---\n")
r1 <- process_conversation(session_id, "I want to buy a flat in Kukatpally", market_data = PROPGPT_MARKET_DATA)
cat("Assistant Reply:\n", r1$reply, "\n")
cat("Ready for prediction:", r1$ready_for_prediction, "\n")
cat("Missing fields:", paste(r1$missing_fields, collapse=", "), "\n")

# Turn 2: Providing missing required fields (BHK and Area)
cat("\n--- TURN 2: User says 'It is a 2 BHK around 1200 sqft' ---\n")
r2 <- process_conversation(session_id, "It is a 2 BHK around 1200 sqft", market_data = PROPGPT_MARKET_DATA)
cat("Assistant Reply:\n", r2$reply, "\n")
cat("Ready for prediction:", r2$ready_for_prediction, "\n")
cat("Optional asked:", r2$conversation_state$optional_fields_asked, "\n")

# Turn 3: Answering optional fields
cat("\n--- TURN 3: User says 'It is semi-furnished resale with 2 bathrooms and 1 balcony' ---\n")
r3 <- process_conversation(session_id, "It is semi-furnished resale with 2 bathrooms and 1 balcony", market_data = PROPGPT_MARKET_DATA)
cat("Ready for prediction:", r3$ready_for_prediction, "\n")
cat("Prediction Result:", r3$prediction, "\n")
cat("Market Context Status:", r3$market_context$status, "\n")

# Turn 4: Follow-up question modifying locality
cat("\n--- TURN 4: User asks follow-up: 'What about the same property in Miyapur?' ---\n")
r4 <- process_conversation(session_id, "What about the same property in Miyapur?", market_data = PROPGPT_MARKET_DATA)
cat("Ready for prediction:", r4$ready_for_prediction, "\n")
cat("New Locality:", r4$property$locality, "\n")
cat("Retained Area:", r4$property$area, "\n")
cat("Retained BHK:", r4$property$bhk, "\n")
cat("New Prediction Result:", r4$prediction, "\n")

cat("\n==================================================\n")
cat("Simulation Test Finished Successfully!\n")
cat("==================================================\n")
