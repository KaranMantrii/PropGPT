# Deterministic conversation regression suite: real saved models and datasets,
# controlled LLM extraction. Run from Backend/: Rscript test_workflow.R
.libPaths(c(normalizePath("../.r-library", mustWork = FALSE), .libPaths()))
source("Plumber.R")
checks <- 0L
check <- function(value, label) {
  if (!isTRUE(value)) stop("FAIL: ", label)
  checks <<- checks + 1L
  cat("PASS:", label, "\n")
}
real_route <- route_prediction
real_insight <- generate_property_insight
model_calls <- 0L
route_prediction <- function(property) {
  model_calls <<- model_calls + 1L
  real_route(property)
}
generate_property_insight <- function(property, prediction_result, market_context, question = NULL) {
  paste("The model estimate is", prediction_result$prediction, "based on the supplied property details. Listing prices are not guaranteed transactions.")
}
turn <- function(id, fields = list(), action = "valuation", text = "test message") {
  payload <- c(fields, list(action = action))
  nemotron_chat <<- function(...) jsonlite::toJSON(payload, auto_unbox = TRUE, null = "null")
  process_conversation(id, text, PROPGPT_MARKET_DATA)
}
basic <- list(intent = "flat_purchase", area = 1200, area_unit = "sqft", bhk = 2, locality = "Kukatpally")
complete <- c(basic, list(furnishing = "Semi-Furnished", transaction = "Resale", area_source = "Super", bathroom = 2, balcony = 0))
r <- turn("required", list(intent = "flat_purchase", locality = "Kukatpally"))
check(all(c("area", "bhk") %in% r$missing_fields) && model_calls == 0, "missing required fields do not invoke a model")
r <- turn("required", list(area = 1200, bhk = 2))
check(!r$ready_for_prediction && r$conversation_state$optional_fields_asked, "required fields across turns then optional question")
check(!grepl("locality|How many BHK", r$reply), "optional prompt does not re-ask required fields")
r <- turn("required", list(furnishing = "Furnished"))
check(r$prediction_success && model_calls == 1L, "partial optional answer predicts exactly once")
r <- turn("full", complete)
check(r$prediction_success && !is.null(r$prediction), "all fields initially supplied predict immediately")
old_calls <- model_calls
r <- turn("full", list(), "explain", "Why is the price high?")
check(model_calls == old_calls && is.null(r$prediction), "explanation reuses previous result without duplicate inference")
r <- turn("full", list(locality = "Miyapur"))
check(r$property$area == 1200 && r$property$bhk == 2 && r$property$locality == "Miyapur" && r$prediction_success, "locality follow-up retains other inputs")
r <- turn("full", list(bhk = 3, furnishing = "Furnished"))
check(r$property$bhk == 3 && r$property$furnishing == "Furnished" && r$prediction_success, "BHK and furnishing corrections produce new estimate")
r <- turn("full", list(area = -1))
check(!r$prediction_success && grepl("positive", r$reply), "invalid numerical correction cannot reuse old estimate")
r <- turn("full", list(area = "nonsense"))
check(!r$prediction_success, "invalid numeric text cannot silently retain old area")
r <- turn("skip", basic)
r <- turn("skip", list(), text = "skip")
check(r$prediction_success, "skipping optional details uses predictor defaults")
r <- turn("isolated", list(locality = "Kokapet"))
check(is.null(r$property$area) && !r$prediction_success, "independent sessions do not share values")
r <- turn("full", list(intent = "rent", locality = "Gachibowli"), "new_prediction")
check(is.null(r$property$area) && is.null(r$property$furnishing) && !r$prediction_success, "new property resets old inputs and optional state")
for (intent in c("flat_purchase", "house_purchase", "rent")) {
  p <- basic; p$intent <- intent
  r <- turn(paste0("model_", intent), p)
  check(!r$prediction_success, paste(intent, "asks optional fields first"))
  if (intent == "rent") check(!grepl("Resale|Transaction|Property Type", r$reply), "rent does not ask purchase transaction")
  if (intent == "house_purchase") check(grepl("Ownership", r$reply) && grepl("floor", r$reply), "house asks its model-specific optional fields")
  r <- turn(paste0("model_", intent), list(), text = "skip")
  check(r$prediction_success && !r$prediction %in% c("N/A", ""), paste(intent, "real saved model returns a price"))
}
p <- complete; p$bathroom <- 1.5
check(!validate_property(p)$valid, "fractional bathrooms rejected")
p <- complete; p$buy_floor <- 0; p$total_floors <- 5
check(validate_property(p)$valid, "ground floor accepted")
p$total_floors <- 0
check(!validate_property(p)$valid, "zero total floors rejected")
p <- complete; p$furnishing <- "luxury"
check(!validate_property(p)$valid, "invalid categories rejected")
p <- complete; p$area <- list(1200, 1300)
check(!validate_property(p)$valid, "nested input rejected safely")
r <- turn("yards", list(intent = "flat_purchase", area = 150, area_unit = "sqyd", bhk = 2, locality = "Kukatpally"))
r <- turn("yards", list(), text = "skip")
check(r$property$area == 1350 && r$property$area_unit == "sqft", "square-yard conversion occurs once across turns")
old_calls <- model_calls
r <- turn("market", list(intent = "flat_purchase", market_localities = c("Kukatpally", "Miyapur")), "market")
check(grepl("median", r$reply) && model_calls == old_calls, "locality comparison uses actual listing statistics without model inference")
r <- turn("market", list(market_localities = "NoSuchLocality"), "market")
check(grepl("No matching", r$reply), "unknown locality has no invented statistics")
p <- validate_property(basic)$data; p$area_source <- "Carpet"
check(get_market_context("flat_purchase", p, list())$status == "dataset_unavailable", "missing dataset returns unavailable context")
route_prediction <- function(...) stop("simulated model failure")
r <- turn("failure", complete)
check(is.null(r$prediction) && !r$prediction_success && !grepl("simulated", r$reply), "model failure never fabricates a price or exposes diagnostics")
nemotron_chat <- function(...) "invalid JSON"
r <- process_conversation("jsonfailure", "test")
check(r$error_code == "invalid_llm_response" && is.null(r$prediction), "malformed LLM response yields explicit error")
nemotron_chat <- function(...) stop("simulated timeout")
r <- process_conversation("timeout", "test")
check(r$error_code == "llm_unavailable" && length(get_conversation_session("timeout")$history) == 2, "LLM failure preserves history and returns actionable error")
cat("\n", checks, "workflow checks passed.\n")
nemotron_chat <- function(...) "Invented tax rate 7% and price 999999."
route_prediction <- real_route
p <- validate_property(basic)$data
estimate <- route_prediction(p)
context <- get_market_context(p$intent, estimate$property, PROPGPT_MARKET_DATA)
reply <- real_insight(estimate$property, estimate, context)
check(!grepl("999999|7%", reply) && grepl(estimate$prediction, reply, fixed = TRUE), "untrusted explanation figures are replaced by backend-owned values")
check(grepl("Default assumptions", reply) && estimate$property$area_source == "Carpet", "actual model defaults are disclosed")
for (intent in c("flat_purchase", "house_purchase", "rent")) {
  p <- validate_property(basic)$data; p$intent <- intent
  direct <- switch(intent, flat_purchase = pred_price_flat(1200, 2, "Kukatpally"), house_purchase = pred_house(1200, 2, "Kukatpally"), rent = pred_rent(1200, 2, "Kukatpally"))
  check(identical(route_prediction(p)$prediction, direct), paste(intent, "router defaults preserve original predictor output"))
}
cat("\nFINAL:", checks, "workflow checks passed.\n")
req <- list(validated_body = list(session_id = "manual_reuse"), validated_property = validate_property(basic)$data)
record_manual_prediction(req, estimate$prediction)
route_prediction <- function(...) stop("A manual explanation must not run inference")
r <- turn("manual_reuse", list(), "explain")
check(is.null(r$prediction) && grepl(estimate$prediction, r$reply, fixed = TRUE), "manual-to-chat explanation reuses the saved model result")
cat("\nTOTAL:", checks, "workflow checks passed.\n")
