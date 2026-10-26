# ==============================================================================
# PROPGPT: COMPLETE EXPLORATORY DATA ANALYSIS (EDA) SCRIPT
# ==============================================================================
# Instructions: Ensure your 'train' dataset is loaded in the environment.
# Required columns: price_num, log_price, area_num, log_area, bhk, 
#                   Furnishing, Transaction, locality, area_per_bhk, 
#                   loc_encoded, Bathroom, Balcony

# 1. Install & Load Required Libraries
install.packages(c("tidyverse", "corrplot", "patchwork", "scales"))

library(tidyverse)
library(corrplot)
library(patchwork)
library(scales)

# Set a professional, clean theme for all plots
theme_set(theme_minimal() + theme(
  plot.title = element_text(face = "bold", size = 14),
  plot.subtitle = element_text(color = "gray30"),
  axis.title = element_text(face = "bold")
))

# ==============================================================================
# PART 1: UNIVARIATE ANALYSIS (Distributions)
# ==============================================================================

cat("Generating Part 1: Univariate Plots...\n")

# 1A. Target Variable: Price (Raw vs Log)
p1_raw_price <- ggplot(train, aes(x = price_num)) +
  geom_histogram(fill = "coral", bins = 50, color = "white") +
  scale_x_continuous(labels = label_number(scale_cut = cut_short_scale())) +
  labs(title = "Raw Price Distribution", subtitle = "Highly skewed right", x = "Price (₹)", y = "Count") +
  theme(axis.text.x = element_text(angle = 45, hjust = 1))

p1_log_price <- ggplot(train, aes(x = log_price)) +
  geom_histogram(fill = "steelblue", bins = 50, color = "white") +
  labs(title = "Log Price Distribution", subtitle = "Normalized for ML", x = "log(Price)", y = "Count")

print(p1_raw_price + p1_log_price)

# 1B. Area Distribution (Raw vs Log)
p2_raw_area <- ggplot(train, aes(x = area)) +
  geom_histogram(fill = "coral", bins = 50, color = "white") +
  xlim(0, 5000) + # Limit x-axis to ignore massive outliers for the visual
  labs(title = "Raw Area Distribution", subtitle = "Capped at 5000 sqft for visibility", x = "Area (sqft)", y = "Count")

p2_log_area <- ggplot(train, aes(x = log_area)) +
  geom_histogram(fill = "steelblue", bins = 50, color = "white") +
  labs(title = "Log Area Distribution", subtitle = "Normalized for ML", x = "log(Area)", y = "Count")

print(p2_raw_area + p2_log_area)

# 1C. Categorical Variables (BHK, Furnishing, Transaction)
p3_bhk <- ggplot(train, aes(x = factor(bhk))) +
  geom_bar(fill = "steelblue") +
  labs(title = "Listings by BHK", x = "BHK", y = "Count")

p3_furnish <- ggplot(train, aes(x = Furnishing)) +
  geom_bar(fill = "steelblue") +
  labs(title = "Furnishing Status", x = "", y = "Count")

p3_trans <- ggplot(train, aes(x = Transaction)) +
  geom_bar(fill = "steelblue") +
  labs(title = "Transaction Type", x = "", y = "Count")

print(p3_bhk / (p3_furnish + p3_trans))

# ==============================================================================
# PART 2: BIVARIATE ANALYSIS (Feature vs Target)
# ==============================================================================

cat("Generating Part 2: Bivariate Plots...\n")

# 2A. Area vs Price (Scatter)
p4_scatter <- ggplot(train, aes(x = log_area, y = log_price)) +
  geom_point(alpha = 0.2, color = "darkblue") +
  geom_smooth(method = "lm", color = "red", linewidth = 1.2) +
  labs(title = "Price vs Area (Log-Log Scale)", 
       subtitle = "The red trendline shows a strong linear relationship",
       x = "Log Area", y = "Log Price")
print(p4_scatter)

# 2B. BHK vs Price (Boxplot)
p5_box_bhk <- ggplot(train, aes(x = factor(bhk), y = price_num, fill = factor(bhk))) +
  geom_boxplot(alpha = 0.7, outlier.color = "red", outlier.alpha = 0.3) +
  scale_y_log10(labels = label_number(scale_cut = cut_short_scale())) +
  labs(title = "Price by BHK", x = "BHK", y = "Price (₹, Log Scale)") +
  theme(legend.position = "none")
print(p5_box_bhk)

# 2C. Furnishing vs Price (Boxplot)
p6_box_furnish <- ggplot(train, aes(x = Furnishing, y = price_num, fill = Furnishing)) +
  geom_boxplot(alpha = 0.7, outlier.alpha = 0.3) +
  scale_y_log10(labels = label_number(scale_cut = cut_short_scale())) +
  labs(title = "Price by Furnishing Status", x = "", y = "Price (₹, Log Scale)") +
  theme(legend.position = "none")
print(p6_box_furnish)

# ==============================================================================
# PART 3: THE "KILLER PLOT" (Locality Analysis)
# ==============================================================================

cat("Generating Part 3: Locality Analysis...\n")

# Find Top 20 Localities for cleaner visuals
top_20_localities <- train |> 
  count(locality, sort = TRUE) |> 
  slice_head(n = 20) |> 
  pull(locality)

# 3A. Price by Locality
p7_box_locality <- train |> 
  filter(locality %in% top_20_localities) |> 
  ggplot(aes(x = reorder(locality, price_num, median), y = price_num)) +
  geom_boxplot(fill = "steelblue", alpha = 0.7, outlier.alpha = 0.2) +
  coord_flip() +
  scale_y_log10(labels = label_number(scale_cut = cut_short_scale())) +
  labs(title = "Price Distribution by Top 20 Localities",
       subtitle = "Ordered by Median Price",
       x = "", y = "Price (₹, Log Scale)")
print(p7_box_locality)

# 3B. Price Per Sq Ft by Locality (Removes Area Bias)
p8_ppsf_locality <- train |> 
  filter(locality %in% top_20_localities, area > 0) |>
  mutate(ppsf = price_num / area) |>
  ggplot(aes(x = reorder(locality, ppsf, median), y = ppsf)) +
  geom_boxplot(fill = "coral", alpha = 0.7, outlier.alpha = 0.2) +
  coord_flip() +
  labs(title = "Price Per Sqft by Top 20 Localities",
       subtitle = "Shows the pure premium of the neighborhood",
       x = "", y = "Price per Sqft (₹)")
print(p8_ppsf_locality)

# ==============================================================================
# PART 4: CORRELATION & MULTICOLLINEARITY
# ==============================================================================

cat("Generating Part 4: Correlation Matrix...\n")

# 4A. Correlation Matrix of Numeric Features
numeric_cols <- train |> 
  select(log_price, log_area, area_per_bhk, bhk, 
         loc_encoded, Furnishing_ord) |> 
  na.omit() # Ensure no NAs for the correlation calculation
class(train$Bathroom)
cor_matrix <- cor(numeric_cols)

# Draw the correlation plot
corrplot(cor_matrix, 
         method = "color", 
         type = "upper", 
         addCoef.col = "black", # Add correlation numbers
         tl.col = "black",      # Text color
         tl.srt = 45,           # Text rotation
         diag = FALSE,          # Remove diagonal line of 1s
         title = "Correlation Matrix of Numeric Features",
         mar = c(0,0,2,0))

cat("EDA Complete! All plots generated in the Plots pane.\n")