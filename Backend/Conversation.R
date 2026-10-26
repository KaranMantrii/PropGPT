# Conversation Management

# In-memory environment to store active sessions.
# Each session has its own history and property data.

PROPGPT_SESSIONS <- new.env(parent = emptyenv())


# Create a new session
create_conversation_session <- function(session_id) {
  
  if (
    is.null(session_id) ||
    length(session_id) != 1 ||
    !nzchar(trimws(session_id))
  ) {
    stop("A valid session ID is required.")
  }
  
  PROPGPT_SESSIONS[[session_id]] <- list(
    history = list(),
    property = empty_extraction(),
    optional_fields_asked = FALSE,
    stage = "collect_required",
    last_prediction = NULL,
    last_market_context = NULL,
    created_at = Sys.time(),
    updated_at = Sys.time()
  )
  
  return(TRUE)
}


# Get missing optional fields for the property intent
get_missing_optional_fields <- function(property) {
  intent <- tolower(trimws(as.character(if (!is.null(property$intent)) property$intent else "flat_purchase")))
  
  fields <- c()
  if (is_empty_value(property$furnishing)) fields <- c(fields, "furnishing")
  if (intent != "rent" && is_empty_value(property$transaction)) fields <- c(fields, "transaction")
  if (is_empty_value(property$area_source)) fields <- c(fields, "area_source")
  if (is_empty_value(property$bathroom)) fields <- c(fields, "bathroom")
  if (is_empty_value(property$balcony)) fields <- c(fields, "balcony")
  
  if (identical(intent, "house_purchase")) {
    if (is_empty_value(property$ownership)) fields <- c(fields, "ownership")
    if (is_empty_value(property$facing)) fields <- c(fields, "facing")
    if (is_empty_value(property$buy_floor)) fields <- c(fields, "buy_floor")
    if (is_empty_value(property$total_floors)) fields <- c(fields, "total_floors")
  } else if (identical(intent, "rent")) {
    if (is_empty_value(property$buy_floor)) fields <- c(fields, "buy_floor")
    if (is_empty_value(property$total_floors)) fields <- c(fields, "total_floors")
  }
  
  fields
}


# Generate conversational optional fields question with examples
generate_optional_fields_prompt <- function(property) {
  bhk_text <- if (!is_empty_value(property$bhk)) paste0(property$bhk, " BHK ") else ""
  loc_text <- if (!is_empty_value(property$locality)) paste0(" in ", property$locality) else ""
  area_text <- if (!is_empty_value(property$area)) paste0(" with approximately ", property$area, " sqft") else ""
  
  missing_opt <- get_missing_optional_fields(property)
  
  lines <- c()
  if ("furnishing" %in% missing_opt) {
    lines <- c(lines, "- **Furnishing:** Is it Unfurnished, Semi-Furnished, or Furnished?")
  }
  if ("transaction" %in% missing_opt) {
    lines <- c(lines, "- **Property Type:** Is this a Resale property or a New Property?")
  }
  if ("area_source" %in% missing_opt) {
    area_label <- if (!is_empty_value(property$area)) paste0(property$area, " sqft") else "area"
    lines <- c(lines, paste0("- **Area Measurement:** Is the ", area_label, " based on Carpet Area or Super Built-up Area?"))
  }
  if ("bathroom" %in% missing_opt) {
    lines <- c(lines, "- **Bathrooms:** How many bathrooms does it have? (e.g., 1, 2, 3)")
  }
  if ("balcony" %in% missing_opt) {
    lines <- c(lines, "- **Balconies:** How many balconies are available? (e.g., 0, 1, 2)")
  }
  labels <- c(ownership = "Ownership: Freehold, Leasehold, Co-operative Society, or Power Of Attorney?",
    facing = "Facing: East, West, North, South, or a diagonal direction?",
    buy_floor = "Which floor is the property on? Use 0 for ground floor.", total_floors = "How many total floors are in the building?")
  for (field in intersect(names(labels), missing_opt)) lines <- c(lines, paste0("- ", labels[[field]]))
  
  if (length(lines) == 0) {
    return("Great! I have all your property details. Let me estimate the property price.")
  }
  
  paste0(
    "Great! I've got the basic details of your property", loc_text, " (", bhk_text, area_text, "). 🏡\n\n",
    "To make the price prediction more accurate, could you share a few additional details?\n\n",
    paste(lines, collapse = "\n"),
    "\n\nYou can provide all the details together or just the ones you know. It's completely fine to skip anything you're unsure about!"
  )
}


# Get an existing session
get_conversation_session <- function(session_id) {
  
  if (!exists(
    session_id,
    envir = PROPGPT_SESSIONS,
    inherits = FALSE
  )) {
    return(NULL)
  }
  
  PROPGPT_SESSIONS[[session_id]]
}


# Delete a session
delete_conversation_session <- function(session_id) {
  
  if (exists(
    session_id,
    envir = PROPGPT_SESSIONS,
    inherits = FALSE
  )) {
    
    rm(
      list = session_id,
      envir = PROPGPT_SESSIONS
    )
    
    return(TRUE)
  }
  
  FALSE
}


# Merge extracted property information
merge_property_details <- function(old_property, new_property) {
  
  # FIX 4: Safely handle if old_property is NULL to prevent state corruption
  if (is.null(old_property)) {
    merged <- empty_extraction()
  } else {
    merged <- old_property
  }
  
  # These are the actual property fields.
  # Do not merge model-generated status fields.
  property_fields <- c(
    "intent",
    "area",
    "area_unit",
    "bhk",
    "locality",
    "furnishing",
    "transaction",
    "area_source",
    "bathroom",
    "balcony",
    "ownership",
    "facing",
    "buy_floor",
    "total_floors"
  )
  
  for (field in property_fields) {
    
    new_value <- new_property[[field]]
    
    # Update only when the new extraction contains
    # a meaningful value.
    if (!is_empty_value(new_value)) {
      merged[[field]] <- new_value
    }
    
  }
  
  return(merged)
}


# Generate a follow-up question
generate_followup_question <- function(validation_result) {
  
  missing <- validation_result$missing_fields
  errors <- validation_result$errors
  
  # Handle invalid values first
  if (length(errors) > 0) {
    return(
      paste(
        "I need a quick clarification:",
        errors[[1]],
        "Could you please provide the correct value?"
      )
    )
  }
  
  # Ask for missing information
  if (length(missing) == 0) {
    return("Your property details are ready for prediction.")
  }
  
  # Handle common multi-field combinations naturally
  if (all(c("bhk", "area") %in% missing)) {
    return("Sure! How many bedrooms (BHK) are you looking for, and approximately how large should the property be (in sq ft)?")
  }
  if (all(c("bhk", "locality") %in% missing)) {
    return("Sure! Which locality in Hyderabad is the property in, and how many BHKs are you looking for?")
  }
  if (all(c("area", "locality") %in% missing)) {
    return("Sure! Which locality in Hyderabad is the property located in, and what is the approximate area in sq ft?")
  }
  
  questions <- list(
    intent = "Are you looking to buy a flat, buy an independent house, or rent a property?",
    area = "What is the approximate property area? You can provide it in square feet or square yards.",
    bhk = "How many BHKs does your property have?",
    locality = "Which locality in Hyderabad is the property located in?"
  )
  
  field_to_ask <- missing[[1]]
  question <- questions[[field_to_ask]]
  
  if (is.null(question)) {
    return(
      paste("Could you please provide the", field_to_ask, "details?")
    )
  }
  
  return(question)
}


# Main conversation function
save_information_reply <- function(session_id, session, reply, market_context = NULL, error_code = NULL) {
  session$history <- append(session$history, list(list(role = "assistant", content = reply)))
  session$updated_at <- Sys.time()
  PROPGPT_SESSIONS[[session_id]] <- session
  list(session_id = session_id, reply = reply, prediction = NULL, prediction_success = FALSE,
    ready_for_prediction = FALSE, property = session$property, market_context = market_context,
    error_code = error_code, conversation_state = list(stage = session$stage,
      optional_fields_asked = isTRUE(session$optional_fields_asked), prediction_ready = FALSE,
      prediction_status = if (is.null(error_code)) "information" else "error"))
}

process_conversation <- function(session_id, user_message, market_data = NULL) {
  
  # Auto-load market data if not passed explicitly
  if (is.null(market_data) && exists("PROPGPT_MARKET_DATA")) {
    market_data <- PROPGPT_MARKET_DATA
  }
  
  # Validate incoming message
  if (
    is.null(user_message) ||
    length(user_message) != 1 ||
    !is.character(user_message) ||
    !nzchar(trimws(user_message))
  ) {
    stop("Please provide a valid message.")
  }
  
  user_message <- trimws(user_message)
  
  # ----------------------------------------
  # Load or create session
  # ----------------------------------------
  
  session <- get_conversation_session(session_id)
  
  if (is.null(session)) {
    create_conversation_session(session_id)
    session <- get_conversation_session(session_id)
  }
  
  # ----------------------------------------
  # Add user message to history
  # ----------------------------------------
  
  session$history <- append(
    session$history,
    list(
      list(
        role = "user",
        content = user_message
      )
    )
  )
  
  # ----------------------------------------
  # Call Nemotron
  # ----------------------------------------
  
  recent_history <- if (length(session$history) > 10) {
    tail(session$history, 10)
  } else {
    session$history
  }
  
  extraction_messages <- build_extraction_messages(
    recent_history,
    current_property = session$property
  )
  
  nemotron_response <- tryCatch(
    nemotron_chat(
      messages = extraction_messages,
      temperature = 0.2,
      max_tokens = 1200,
      json_mode = TRUE
    ),
    error = function(e) {
      message("Nemotron extraction failed: ", conditionMessage(e))
      return(NULL)
    }
  )
  
  # Handle LLM connection failure gracefully
  if (is.null(nemotron_response)) {
    return(save_information_reply(session_id, session,
      "The AI service is temporarily unavailable. Please try again, or use the manual predictor.", error_code = "llm_unavailable"))
  }

  # ----------------------------------------
  # Extract property information
  # ----------------------------------------
  
  extracted_property <- tryCatch(
    extract_property_details(nemotron_response),
    error = function(e) {
      message("Nemotron JSON extraction failed: ", conditionMessage(e))
      return(NULL)
    }
  )
  if (is.null(extracted_property)) return(save_information_reply(session_id, session,
    "I couldn't read the AI service's response. Please retry your message.", error_code = "invalid_llm_response"))

  action <- extracted_property$action
  if (is.null(action) || !is.character(action) || length(action) != 1) action <- "valuation"
  if (action == "new_prediction") {
    session$property <- empty_extraction()
    session$optional_fields_asked <- FALSE
    session$last_prediction <- NULL
    session$last_market_context <- NULL
  }
  if (action == "explain" && !is.null(session$last_prediction)) {
    reply <- tryCatch(generate_property_insight(session$last_prediction$property, session$last_prediction,
      session$last_market_context, question = user_message), error = function(e) {
        message("Explanation failed: ", conditionMessage(e))
        paste("The previous model estimate was", session$last_prediction$prediction,
          "based on the saved property details. A more detailed explanation is temporarily unavailable.")
      })
    return(save_information_reply(session_id, session, reply, session$last_market_context))
  }
  if (action == "market") {
    property <- merge_property_details(session$property, extracted_property)
    localities <- extracted_property$market_localities
    if (is.null(localities) || !length(localities)) localities <- property$locality
    if (!is.character(unlist(localities)) || length(localities) > 5) localities <- NULL
    intent <- .market_normalize_intent(property$intent)
    if (is.na(intent)) intent <- "flat"
    summaries <- list()
    market_bhk <- if (is_positive_integer(extracted_property$bhk)) as.numeric(extracted_property$bhk) else NULL
    market_basis <- tryCatch(normalize_area_source(extracted_property$area_source), error = function(e) NULL)
    lines <- c("These figures describe advertised listings in the available dataset, not current transaction prices.")
    for (locality in as.character(unlist(localities))) {
      data <- market_data[[intent]]
      stats <- if (is.null(data)) NULL else switch(intent,
        flat = get_flat_locality_stats(data, locality, bhk = market_bhk, area_source = market_basis),
        house = get_house_locality_stats(data, locality, bhk = market_bhk, area_source = market_basis),
        rent = get_rent_locality_stats(data, locality, bhk = market_bhk, area_source = market_basis))
      summaries[[locality]] <- stats
      if (is.null(stats)) lines <- c(lines, paste("No matching listing statistics are available for", locality)) else {
        median_value <- if (intent == "rent") stats$median_rent else stats$median_price
        rate <- if (intent == "rent") stats$median_rent_per_sqft else stats$median_price_per_sqft
        lines <- c(lines, paste0("**", locality, "** (", if (is.null(market_bhk)) "all bedroom counts" else paste(market_bhk, "BHK"),
          ", ", if (is.null(market_basis)) "all area bases" else market_basis, "): ", stats$listings, " listings; median ",
          if (intent == "rent") "monthly rent" else "asking price", " ₹", format(round(median_value), big.mark = ",", scientific = FALSE),
          "; median ₹", format(round(rate), big.mark = ",", scientific = FALSE), " per sq.ft", if (intent == "rent") " per month." else "."))
      }
    }
    if (!length(localities)) lines <- "Which Hyderabad locality or localities would you like to compare, and are you interested in flats, houses, or rents?"
    return(save_information_reply(session_id, session, paste(lines, collapse = "\n\n"), list(locality_statistics = summaries)))
  }
  if (action == "general") return(save_information_reply(session_id, session,
    "I can help estimate Hyderabad flat and house purchase prices or monthly rents, and compare advertised listings by locality. What would you like to explore?"))
  
  # ----------------------------------------
  # Merge new and previous information
  # ----------------------------------------
  
  merged_property <- merge_property_details(
    old_property = session$property,
    new_property = extracted_property
  )
  
  # ----------------------------------------
  # Validate merged information
  # ----------------------------------------
  
  validation_result <- validate_property(
    merged_property
  )
  
  # Use only the validated data from this point
  validated_property <- validation_result$data
  
  # ----------------------------------------
  # Two-Stage Decision Workflow
  # ----------------------------------------
  
  # Required fields check (intent, area, bhk, locality)
  required_complete <- (length(validation_result$missing_fields) == 0 && length(validation_result$errors) == 0)
  
  optional_already_asked <- isTRUE(session$optional_fields_asked)
  missing_optional <- get_missing_optional_fields(validated_property)
  
  prediction_result <- NULL
    prediction_error <- NULL
  market_context <- NULL
  market_error <- NULL
  property_insight <- NULL
  insight_error <- NULL
  
  if (!required_complete) {
    # --------------------------------------------------------
    # STAGE 1: Collect required fields
    # --------------------------------------------------------
    session$stage <- "collect_required"
    is_ready_for_prediction <- FALSE
    
    # If the user has validation errors (e.g. invalid area or bhk), explain the error
    if (length(validation_result$errors) > 0) {
      assistant_reply <- paste(
        "I need a quick clarification:",
        validation_result$errors[[1]],
        "Could you please provide the correct value?"
      )
    } else {
      # Use LLM reply if it naturally asks for the required field; otherwise use generator
      assistant_reply <- generate_followup_question(validation_result)
    }
    
  } else if (!optional_already_asked && length(missing_optional) > 0 &&
    !grepl("skip|use defaults|no other details", user_message, ignore.case = TRUE)) {
    # --------------------------------------------------------
    # STAGE 2: Ask for optional fields (exactly once per session)
    # --------------------------------------------------------
    session$stage <- "ask_optional"
    session$optional_fields_asked <- TRUE
    is_ready_for_prediction <- FALSE
    
    assistant_reply <- generate_optional_fields_prompt(validated_property)
    
  } else {
    # --------------------------------------------------------
    # STAGE 3: Proceed to prediction
    # --------------------------------------------------------
    session$stage <- "completed"
    session$optional_fields_asked <- TRUE
    is_ready_for_prediction <- TRUE
    
    prediction_result <- tryCatch(
      route_prediction(validated_property),
      error = function(e) {
        message("Model prediction failed: ", conditionMessage(e))
        prediction_error <<- conditionMessage(e)
        NULL
      }
    )
    
    # Generate Market Intelligence Context
    if (!is.null(prediction_result)) validated_property <- prediction_result$property
    if (!is.null(prediction_result) && !is.null(market_data)) {
      market_property <- as.list(validated_property)
      if (is.null(market_property$area_source) || !nzchar(trimws(as.character(market_property$area_source)))) {
        market_property$area_source <- "Carpet"
      }
      market_context <- tryCatch(
        get_market_context(
          intent = validated_property$intent,
          property = market_property,
          market_data = market_data
        ),
        error = function(e) {
          market_error <<- conditionMessage(e)
          NULL
        }
      )
    }
    
    # Generate AI Property Explanation
    if (!is.null(prediction_result)) {
      session$last_prediction <- prediction_result
      session$last_market_context <- market_context
      property_insight <- tryCatch(
        generate_property_insight(
          property = as.list(validated_property),
          prediction_result = prediction_result,
          market_context = market_context
        ),
        error = function(e) {
          insight_error <<- conditionMessage(e)
          NULL
        }
      )
      
      if (!is.null(property_insight)) {
        assistant_reply <- property_insight
      } else {
        assistant_reply <- paste(
          "Your property details have been verified.",
          "Your ML-based price estimate is:",
          prediction_result$prediction,
          "This is a model estimate, not a guaranteed transaction price. Actual prices vary."
        )
      }
    } else {
      assistant_reply <- paste(
        "Your property details are valid, but I couldn't generate the estimate right now:",
        "The valuation model is temporarily unavailable. Please try again."
      )
    }
  }
  
  # ----------------------------------------
  # Save assistant response in history
  # ----------------------------------------
  
  session$history <- append(
    session$history,
    list(
      list(
        role = "assistant",
        content = assistant_reply
      )
    )
  )
  
  # ----------------------------------------
  # Update session
  # ----------------------------------------
  
  session$property <- validated_property
  session$prediction_status <- if (!is_ready_for_prediction) "collecting" else if (is.null(prediction_result)) "failed" else "completed"
  session$updated_at <- Sys.time()
  
  PROPGPT_SESSIONS[[session_id]] <- session
  
  # ----------------------------------------
  # Return response with conversation_state
  # ----------------------------------------
  
  return(
    list(
      session_id = session_id,
      reply = assistant_reply,
      ready_for_prediction = is_ready_for_prediction,
      prediction_success = !is.null(prediction_result),
      prediction = if (!is.null(prediction_result)) {
        prediction_result$prediction
      } else {
        NULL
      },
      intent = validated_property$intent,
      missing_fields = validation_result$missing_fields,
      errors = validation_result$errors,
      prediction_error = if (!is.null(prediction_error)) "The valuation model is temporarily unavailable." else NULL,
      market_context = market_context,
      market_error = if (!is.null(market_error)) "Listing comparisons are temporarily unavailable." else NULL,
      property_insight = property_insight,
      insight_error = if (!is.null(insight_error)) "The detailed explanation is temporarily unavailable." else NULL,
      property = validated_property,
      conversation_state = list(
        stage = session$stage,
        prediction_status = session$prediction_status,
        previous_prediction = session$last_prediction$prediction,
        required_fields = list(
          query_area = validated_property$area,
          query_bhk = validated_property$bhk,
          query_locality = validated_property$locality
        ),
        optional_fields = list(
          query_Furnishing = validated_property$furnishing,
          query_Transaction = validated_property$transaction,
          query_area_source = validated_property$area_source,
          query_Bathroom = validated_property$bathroom,
          query_Balcony = validated_property$balcony
          , query_ownership = validated_property$ownership, query_facing = validated_property$facing,
          query_buy_floor = validated_property$buy_floor, query_total_floors = validated_property$total_floors
        ),
        required_fields_complete = required_complete,
        optional_fields_asked = isTRUE(session$optional_fields_asked),
        prediction_ready = is_ready_for_prediction
      )
    )
  )
}
