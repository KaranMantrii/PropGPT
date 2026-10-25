# Test House and Rent E2E Conversational Inferences

readRenviron(".Renviron")
source("Plumber.R")

cat("\n==================================================\n")
cat("Testing House & Rent Inferences via Conversation\n")
cat("==================================================\n")

# House Test
sid_house <- paste0("test_house_", format(Sys.time(), "%H%M%S"))
cat("\n--- Test House: 4 BHK House in Jubilee Hills 3000 sqft ---\n")
h_res1 <- process_conversation(sid_house, "I want to buy a 4 BHK independent house in Jubilee Hills 3000 sqft", market_data = PROPGPT_MARKET_DATA)
cat("Ready for prediction:", h_res1$ready_for_prediction, "\n")
cat("Stage:", h_res1$conversation_state$optional_fields_asked, "\n")

h_res2 <- process_conversation(sid_house, "It is freehold east facing with 4 bathrooms on 1st floor of 2 floors", market_data = PROPGPT_MARKET_DATA)
cat("Ready for prediction:", h_res2$ready_for_prediction, "\n")
cat("House Prediction Result:", h_res2$prediction, "\n")
cat("Market Context Status:", h_res2$market_context$status, "\n")

# Rent Test
sid_rent <- paste0("test_rent_", format(Sys.time(), "%H%M%S"))
cat("\n--- Test Rent: 2 BHK Flat for rent in Gachibowli 1250 sqft ---\n")
r_res1 <- process_conversation(sid_rent, "I want to rent a 2 BHK flat in Gachibowli around 1250 sqft", market_data = PROPGPT_MARKET_DATA)
cat("Ready for prediction:", r_res1$ready_for_prediction, "\n")
cat("Stage:", r_res1$conversation_state$optional_fields_asked, "\n")

r_res2 <- process_conversation(sid_rent, "It is semi-furnished with 2 bathrooms on 4th floor of 10 floors", market_data = PROPGPT_MARKET_DATA)
cat("Ready for prediction:", r_res2$ready_for_prediction, "\n")
cat("Rent Prediction Result:", r_res2$prediction, "\n")
cat("Market Context Status:", r_res2$market_context$status, "\n")

cat("\n==================================================\n")
cat("House and Rent Tests Completed!\n")
cat("==================================================\n")
