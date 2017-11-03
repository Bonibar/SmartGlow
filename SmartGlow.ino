#include <SPIFFS.h>
#include <FS.h>
#include <FSImpl.h>
#include <vfs_api.h>
#include <map>

#include <SPI.h>
#include <dummy.h>
#include <SD.h>
#include <WiFi.h>

#include "./SG_AccessPoint.hpp"
#include "./SG_WebServer.hpp"

/*
 * Parameters
 */
const int LED_PIN = GPIO_NUM_4;
const int CAPTEUR_PIN = GPIO_NUM_2;

String ssid = "JeanJacquesDuino";          //  your network SSID (name) 
String pass = "JeanJacquesSecret";   // your network password
int keyIndex = 0;                 // your network key Index number (needed only for WEP)
int status = WL_IDLE_STATUS;

SG_AccessPoint SG_AP;
SG_WebServer SG_WS;

/*
 * ESP32 Functions
 */
void setup() {
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);
  Serial.begin(9600);
  if (!SPIFFS.begin()) {
    Serial.println("FORMATING");
    SPIFFS.format();
    Serial.println(SPIFFS.begin());
  }
  SG_AP.start(ssid, pass);
  SG_WS.loadWifi();
  SG_WS.start();
}

void loop() {
  SG_WS.waitNewClient();
}



