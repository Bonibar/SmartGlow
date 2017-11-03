#include <WiFi.h>

class SG_AccessPoint {
public:
  SG_AccessPoint() {}
  ~SG_AccessPoint() {}

  IPAddress getIP() {
    IPAddress myIP = WiFi.softAPIP();
    return myIP;
  }

  bool start(String ssid, String pass) {
    bool result = WiFi.softAP(ssid.c_str(), pass.c_str());
    //Serial.print("AP IP address: ");
    //Serial.println(getIP());
    return (result);
  }

  bool stop() {
    return WiFi.softAPdisconnect();
  }
};

