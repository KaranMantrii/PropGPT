
# PropGPT - NVIDIA Nemotron LLM Client

library(httr2)
library(jsonlite)
# NVIDIA API configuration
NVIDIA_BASE_URL <- "https://integrate.api.nvidia.com/v1"
NVIDIA_MODEL <- "nvidia/nemotron-3-ultra-550b-a55b"


# Main function: Send messages to Nemotron


nemotron_chat <- function(
    messages,
    temperature = 0.2,
    max_tokens = 1200,
    enable_thinking = FALSE
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
    
    error_body <- tryCatch(
      httr2::resp_body_string(response),
      error = function(e) "Unable to read error response."
    )
    
    stop(
      "NVIDIA API returned HTTP ",
      status_code,
      ": ",
      error_body
    )
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
    market_context
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
    market_intelligence = market_context
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
      content = get_property_insight_prompt()
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
  
  response <- nemotron_chat(
    messages = messages,
    temperature = 0.2,
    max_tokens = 1200,
    enable_thinking = FALSE
  )
  
  if (
    is.null(response) ||
    !is.character(response) ||
    length(response) != 1 ||
    !nzchar(trimws(response))
  ) {
    stop("Nemotron returned an empty property explanation.")
  }
  
  trimws(response)
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
