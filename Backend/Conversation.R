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
  if (is_empty_value(property$transaction)) fields <- c(fields, "transaction")
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
      max_tokens = 1200
    ),
    error = function(e) {
      return(NULL)
    }
  )
  
  # Handle LLM connection failure gracefully
  if (is.null(nemotron_response)) {
    return(
      list(
        session_id = session_id,
        reply = "I'm having trouble connecting to my brain right now. Please try again in a moment.",
        ready_for_prediction = FALSE,
        prediction_success = FALSE,
        prediction = NULL,
        intent = NULL,
        missing_fields = character(0),
        errors = "Nemotron API connection failed",
        prediction_error = NULL,
        market_context = NULL,
        market_error = NULL,
        property = session$property,
        conversation_state = list(
          required_fields = list(),
          optional_fields = list(),
          required_fields_complete = FALSE,
          optional_fields_asked = isTRUE(session$optional_fields_asked),
          prediction_ready = FALSE
        )
      )
    )
  }
  
  # ----------------------------------------
  # Extract property information
  # ----------------------------------------
  
  extracted_property <- tryCatch(
    extract_property_details(nemotron_response),
    error = function(e) {
      return(empty_extraction()) 
    }
  )
  
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
      llm_reply <- trimws(as.character(extracted_property$reply))
      if (nzchar(llm_reply) && !grepl("furnishing|balcon|bathroom|carpet|super", llm_reply, ignore.case = TRUE)) {
        assistant_reply <- llm_reply
      } else {
        assistant_reply <- generate_followup_question(validation_result)
      }
    }
    
  } else if (!optional_already_asked && length(missing_optional) > 0) {
    # --------------------------------------------------------
    # STAGE 2: Ask for optional fields (exactly once per session)
    # --------------------------------------------------------
    session$stage <- "ask_optional"
    session$optional_fields_asked <- TRUE
    is_ready_for_prediction <- FALSE
    
    llm_reply <- trimws(as.character(extracted_property$reply))
    # If LLM reply contains a friendly question asking for optional fields, use it;
    # otherwise fallback to our structured conversational template.
    if (nzchar(llm_reply) && grepl("furnishing|property|carpet|super|bathroom|balcon|optional", llm_reply, ignore.case = TRUE)) {
      assistant_reply <- llm_reply
    } else {
      assistant_reply <- generate_optional_fields_prompt(validated_property)
    }
    
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
        prediction_error <<- conditionMessage(e)
        NULL
      }
    )
    
    # Generate Market Intelligence Context
    if (!is.null(prediction_result) && !is.null(market_data)) {
      market_property <- as.list(validated_property)
      if (is.null(market_property$area_source) || !nzchar(trimws(as.character(market_property$area_source)))) {
        market_property$area_source <- "super"
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
          prediction_result$prediction
        )
      }
    } else {
      assistant_reply <- paste(
        "Your property details are valid, but I couldn't generate the estimate right now:",
        if (!is.null(prediction_error)) prediction_error else "Please try again."
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
      prediction_error = prediction_error,
      market_context = market_context,
      market_error = market_error,
      property_insight = property_insight,
      insight_error = insight_error,
      property = validated_property,
      conversation_state = list(
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
        ),
        required_fields_complete = required_complete,
        optional_fields_asked = isTRUE(session$optional_fields_asked),
        prediction_ready = is_ready_for_prediction
      )
    )
  )
}