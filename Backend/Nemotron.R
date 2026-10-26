
# PropGPT - NVIDIA Nemotron LLM Client

library(httr2)
library(jsonlite)
# NVIDIA API configuration
NVIDIA_BASE_URL <- sub("/+$", "", Sys.getenv("NVIDIA_BASE_URL", "https://integrate.api.nvidia.com/v1"))
NVIDIA_MODEL <- Sys.getenv("NVIDIA_MODEL", "nvidia/nemotron-3-ultra-550b-a55b")


# Main function: Send messages to Nemotron


nemotron_chat <- function(
    messages,
    temperature = 0.2,
    max_tokens = 1200,
    enable_thinking = FALSE,
    json_mode = FALSE
) {
  
  # Retrieve API key from environment
  api_key <- Sys.getenv("NVIDIA_API_KEY")
  
  if (identical(api_key, "")) {
    stop("NVIDIA_API_KEY is missing. Add it to backend/.Renviron.")
  }
  
  # Validate messages
  if (!is.list(messages) || length(messages) == 0) {
    stop("messages must be a non-empty list.")
  }
  
  for (message in messages) {
    
    if (is.null(message$role) || is.null(message$content)) {
      stop("Every message must contain 'role' and 'content'.")
    }
    
    if (!message$role %in% c("system", "user", "assistant")) {
      stop("Invalid message role: ", message$role)
    }
  }
  
  # 4. Construct request body
  request_body <- list(
    model = NVIDIA_MODEL,
    messages = messages,
    temperature = temperature,
    top_p = 0.95,
    max_tokens = max_tokens,
    stream = FALSE,
    chat_template_kwargs = list(
      enable_thinking = enable_thinking
    )
  )
  if (json_mode) request_body$response_format <- list(type = "json_object")
  
  # 5. Construct HTTP request
  request <- httr2::request(
    paste0(NVIDIA_BASE_URL, "/chat/completions")
  ) |>
    httr2::req_method("POST") |>
    httr2::req_headers(
      Authorization = paste("Bearer", api_key),
      `Content-Type` = "application/json",
      Accept = "application/json"
    ) |>
    httr2::req_body_json(request_body, auto_unbox = TRUE) |>
    httr2::req_timeout(90) |>
    httr2::req_error(is_error = function(resp) FALSE)
  
  # 6. Send request
  response <- tryCatch(
    httr2::req_perform(request),
    error = function(e) {
      stop("NVIDIA API request failed: ", conditionMessage(e))
    }
  )
  
  # 7. Check HTTP status
  status_code <- httr2::resp_status(response)
  
  if (status_code < 200 || status_code >= 300) {
    
    stop("NVIDIA API returned HTTP ", status_code, ".")
  }
  
  # 8. Parse JSON response
  result <- tryCatch(
    httr2::resp_body_json(response, simplifyVector = FALSE),
    error = function(e) {
      stop("Could not parse NVIDIA API response: ", conditionMessage(e))
    }
  )
  
  # 9. Extract assistant response
  if (
    is.null(result$choices) ||
    length(result$choices) == 0 ||
    is.null(result$choices[[1]]$message$content)
  ) {
    stop("NVIDIA returned an unexpected response structure.")
  }
  
  assistant_response <- result$choices[[1]]$message$content
  
  # 10. Return clean text
  return(assistant_response)
}

# ------------------------------------------------------------
# PROPERTY INSIGHT GENERATION
# ------------------------------------------------------------

generate_property_insight <- function(
    property,
    prediction_result,
    market_context,
    question = NULL
) {
  
  if (is.null(prediction_result)) {
    stop("Prediction result is required.")
  }
  
  prediction_value <- prediction_result$prediction
  
  if (is.null(prediction_value)) {
    stop("ML prediction value is missing.")
  }
  
  # Prepare evidence for Nemotron.
  # The model receives the actual ML output and market data.
  evidence <- list(
    property = property,
    ml_prediction = prediction_value,
    market_intelligence = market_context,
    user_question = question
  )
  
  evidence_json <- jsonlite::toJSON(
    evidence,
    auto_unbox = TRUE,
    null = "null",
    na = "null",
    dataframe = "rows",
    POSIXt = "ISO8601",
    pretty = TRUE
  )
  
  messages <- list(
    
    list(
      role = "system",
      content = paste(get_property_insight_prompt(),
        "Return at most 100 words of qualitative explanation only. Do not include ANY numbers, currency amounts, percentages, numeric ranges, or spelled-out numerical claims. The backend renders all numerical results separately.",
        "Do not claim live/current data, verified transactions, feature importance or causal price drivers. No tax rates or appreciation forecasts. Discuss only supplied evidence and its limits.")
    ),
    
    list(
      role = "user",
      content = paste(
        "Analyze the following property using only the supplied evidence.",
        "\n\nPROPERTY AND MODEL EVIDENCE:\n",
        evidence_json
      )
    )
    
  )
  
  response <- tryCatch(nemotron_chat(
    messages = messages,
    temperature = 0.2,
    max_tokens = 350,
    enable_thinking = FALSE
  ), error = function(e) {
    message("Property explanation unavailable: ", conditionMessage(e))
    "The estimate uses the supplied property details and the trained valuation model. Advertised listings provide context rather than a guaranteed transaction price."
  })
  
  if (
    is.null(response) ||
    !is.character(response) ||
    length(response) != 1 ||
    !nzchar(trimws(response))
  ) {
    stop("Nemotron returned an empty property explanation.")
  }
  
  # All displayed figures come from backend values. Reject numerical prose;
  # the explanatory model cannot introduce an extra price, percentage or rate.
  explanation <- trimws(response)
  if (grepl("[[:digit:]%₹]", explanation)) explanation <- "The estimate uses the supplied property details and the trained valuation model. Advertised listings provide context; they do not establish the final negotiated price."
  money <- function(value) paste0("₹", format(round(value), big.mark = ",", scientific = FALSE))
  lines <- c(paste0("**", if (is.null(question)) "Model estimate" else "Previous model estimate", ": ", prediction_value, "**"),
    paste0("**Property:** ", property$bhk, " BHK in ", property$locality, ", ", property$area, " sq.ft (", property$area_source, ")."), explanation)
  stats <- market_context$locality_statistics
  if (is.data.frame(stats) && nrow(stats) > 0) {
    rent <- identical(property$intent, "rent")
    median <- if (rent) stats$median_rent[[1]] else stats$median_price[[1]]
    low <- if (rent) stats$q1_rent[[1]] else stats$q1_price[[1]]
    high <- if (rent) stats$q3_rent[[1]] else stats$q3_price[[1]]
    rate <- if (rent) stats$median_rent_per_sqft[[1]] else stats$median_price_per_sqft[[1]]
    lines <- c(lines, paste0("**Listing evidence:** ", stats$listings[[1]], " matching locality listings; median ",
      if (rent) "monthly rent " else "asking price ", money(median), "; middle half of listings ", money(low), "–", money(high),
      "; median ", money(rate), " per sq.ft", if (rent) " per month." else "."))
  } else lines <- c(lines, "No matching locality statistics could be established from the available dataset.")
  if (!is.null(market_context$comparables) && nrow(market_context$comparables) > 0 &&
      any(market_context$comparables$match_scope != "same_locality")) lines <- c(lines, "Some comparable listings come from other localities because local matches were limited.")
  if (length(property$assumptions)) lines <- c(lines, paste("**Default assumptions:**", paste(property$assumptions, collapse = "; ")))
  lines <- c(lines, "This is a model estimate, not a certified appraisal or guaranteed transaction price. Listing data may be historical. Actual prices vary with condition, amenities and negotiations.")
  paste(lines, collapse = "\n\n")
}

# ------------------------------------------------------------
# Quick connection test
# ------------------------------------------------------------

test_nemotron <- function() {
  
  test_messages <- list(
    list(
      role = "system",
      content = "You are a helpful assistant."
    ),
    list(
      role = "user",
      content = "Reply with exactly: PropGPT Nemotron connection successful."
    )
  )
  
  response <- nemotron_chat(
    messages = test_messages,
    temperature = 0,
    max_tokens = 100,
    enable_thinking = FALSE
  )
  
  cat("\nNemotron response:\n")
  cat(response, "\n")
  
  invisible(response)
}
