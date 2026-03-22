// =============================================
// ESP32 Worker Monitor - Correct Backend Integration
// POST to: http://10.255.207.79:5002/api/sensor
// Fields: temperature, bpm, motion, fall, latitude, longitude
// =============================================

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// --- WiFi Credentials ---
const char* ssid     = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// --- Backend URL (use your PC IP on same WiFi) ---
const char* serverURL = "http://10.255.207.79:5002/api/sensor";

void setup() {
  Serial.begin(115200);

  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi Connected: " + WiFi.localIP().toString());
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {

    // --- Read your actual sensor values here ---
    float temperature = readTemperature();  // DHT11
    int   bpm         = readHeartRate();    // MAX30102
    float motion      = readMotion();       // MPU6050
    bool  fall        = detectFall();       // MPU6050 fall logic
    float latitude    = 11.0123;            // GPS or fixed
    float longitude   = 78.2345;

    // --- Build JSON exactly matching backend schema ---
    StaticJsonDocument<256> doc;
    doc["temperature"] = temperature;
    doc["bpm"]         = bpm;
    doc["motion"]      = motion;
    doc["fall"]        = fall;
    doc["latitude"]    = latitude;
    doc["longitude"]   = longitude;

    String jsonBody;
    serializeJson(doc, jsonBody);

    Serial.println("Sending: " + jsonBody);

    // --- HTTP POST ---
    HTTPClient http;
    http.begin(serverURL);
    http.addHeader("Content-Type", "application/json");

    int httpCode = http.POST(jsonBody);

    if (httpCode == 200 || httpCode == 201) {
      String response = http.getString();
      Serial.println("Saved OK: " + response);
    } else {
      Serial.println("POST failed, HTTP code: " + String(httpCode));
      Serial.println("Error: " + http.errorToString(httpCode));
    }

    http.end();
  } else {
    Serial.println("WiFi disconnected, reconnecting...");
    WiFi.reconnect();
  }

  delay(5000); // send every 5 seconds
}

// =============================================
// Replace these with your actual sensor reads
// =============================================

float readTemperature() {
  // Example: return dht.readTemperature();
  return 31.30;
}

int readHeartRate() {
  // Example: return pox.getHeartRate();
  return 82;
}

float readMotion() {
  // Example: return sqrt(ax*ax + ay*ay + az*az);
  return 9.41;
}

bool detectFall() {
  // Example: return motion > 20.0;
  return false;
}
