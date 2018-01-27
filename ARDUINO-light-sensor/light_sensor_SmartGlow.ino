#include <WiFi.h>
#include <WiFiClient.h>
#include <WiFiServer.h>
#include <WiFiUdp.h>
#include <PubSubClient.h>

const int PHOTOCELL_PIN = 0; // PIN ANALOG where the photocell is connected
int photocell_value;

// Wifi/MQTT settings
char ssid[] = "Home";
char pass[] = "Come_Back";
const char* MQTT_SERVER = "http://test.mosquitto.org/";
const char* MQTT_CLIENT_NAME = "CLIENT_0751";
const int UID = 57;

WiFiClient wClient;
PubSubClient mqttClient(wClient);

void callback(char* topic, byte* payload, unsigned int length) {
  Serial.print("Message arrived [");
  Serial.print(topic);
  Serial.print("] ");
  for (int i = 0; i < length; i++) {
    char receivedChar = (char)payload[i];
    Serial.print(receivedChar);
  }
}

void reconnect() {
 // Loop until we're reconnected
 while (!mqttClient.connected()) {
 Serial.print("Attempting MQTT connection...");
 // Attempt to connect
 if (mqttClient.connect(MQTT_CLIENT_NAME)) {
  Serial.println("connected");
 } else {
  Serial.print("failed, rc=");
  Serial.print(mqttClient.state());
  Serial.println(" try again in 5 seconds");
  // Wait 5 seconds before retrying
  delay(5000);
  }
 }
}

void setup() {
  Serial.begin(9600); // For debug

  int status = WiFi.begin(ssid, pass);
  if (status != WL_CONNECTED) {
    Serial.println("Wifi error");
  }

  mqttClient.setServer(MQTT_SERVER, 1883);
  mqttClient.setCallback(callback);
}

// Lux values
// 1 - Moonlight
// 10 - Dark room
// 100 - Light room
// 1000 - Overcast day
// 10.000 - Daylight
void loop() {
  photocell_value = analogRead(PHOTOCELL_PIN);
  Serial.print("Photocell value: ");
  Serial.println(photocell_value);

  if (!mqttClient.connected()) {
    reconnect();
  } else {
    char buf[5];
    itoa(photocell_value, buf, 10);
    String adr = "smartglow/light-sensor/";
    String adr_wid = adr + UID + "/update";
    Serial.print("Publishing value on ");
    Serial.println(adr_wid);
    char addr[50];
    adr_wid.toCharArray(addr, 50);
    mqttClient.publish(addr, buf);
  }

  mqttClient.loop();

  delay(100); // read values every .1s
}
