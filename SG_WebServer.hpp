#include <WiFi.h>
const int LED_PIN_SERV = GPIO_NUM_4;

class SG_WebServer {
  private:
    WiFiServer server;

  public:
    SG_WebServer() : server(80) {}
    ~SG_WebServer() {}

    bool start() {
      server.begin();
      printWifiStatus();
      return (true);
    }

    bool stop() {
      return (true);
    }

    void waitNewClient() {
      WiFiClient client = server.available();
      if (client) {
        String route = getRoute(client);
        if (route == "GET /") {
          SendIndex(client);
        }
        else if (route == "POST /wifi") {
          digitalWrite(LED_PIN_SERV, HIGH);
          String body = readBody(client);
          Serial.println(body);
          saveWifi(body);
          loadWifi();
        }
        delay(1);
      }
    }

    void SendIndex(WiFiClient client) {
      client.println("HTTP/1.1 200 OK");
      client.println("Content-Type: text/html");
      client.println();
      client.println("<!DOCTYPE HTML>");
      client.println("<html>");
      client.println("<head>");
      client.println("<title>Connect WI-FI</title>");
      client.println("</head>");
      client.println("<body>");
      client.println("<form name=\"wifiConnection\" action=\"/wifi\" method=\"POST\">");
      client.println("<input type=\"text\" name=\"ssid\" placeholder=\"SSID\" /> <br />");
      client.println("<input type=\"password\" name=\"password\" placeholder=\"Password\" /> <br />");
      client.println("<input type=\"submit\" value=\"Connect to WIFI\" /> <br />");
      client.println("</form>");
      client.println("</body>");
      client.println("</html>");
    }

    String getRoute(WiFiClient client) {
      boolean currentLineIsBlank = true;
      String currentLine = "";
      while (client.connected()) {
        if (client.available()) {
          char c = client.read();
          if (c == '\n') {
            if (currentLineIsBlank) {
              return "GET /";
            }
            if (currentLine.startsWith("POST /wifi")) {
              return "POST /wifi";
            }
            currentLineIsBlank = true;
            currentLine = "";
          }
          else if (c != '\r') {
            currentLineIsBlank = false;
            currentLine += c;
          }
        }
      }
      return "GET /";
    }

    String readBody(WiFiClient client) {
      String content = "";
      while (client.available()) {
        char c = client.read();
        content += c;
      }
      return content;
    }

    void printWifiStatus() {
      Serial.print("SSID: ");
      Serial.println(WiFi.SSID());
      long rssi = WiFi.RSSI();
      Serial.print("signal strength (RSSI):");
      Serial.print(rssi);
      Serial.println(" dBm");
    }

    void loadWifi() {
      Serial.println("Reading file");
      File file = SPIFFS.open("/my_file.txt", "r");
      while (file.available()) {
        Serial.println("Is available");
        String line = file.readStringUntil('\n');
        Serial.println(line);
        if (line.startsWith("ssid=iPhone")) {
          digitalWrite(LED_PIN_SERV, HIGH);
        }

        std::map<String, String> parsed = parseBody(line);
        Serial.println("---***---");
        Serial.println(parsed["ssid"]);
        Serial.println(parsed["password"]);
        Serial.println("---***---");
      }
      file.close();
    }

    void saveWifi(String data) {
      File file = SPIFFS.open("/my_file.txt", "w");
      file.println(data);
      Serial.println(data);
      file.close();
    }

    std::map<String, String> parseBody(String body) {
      std::map<String, String> parsed;
      const int index = body.indexOf("&");
      if (index != -1) {
        parsed = parseBody(body.substring(index + 1));
      }
      String keyval = body.substring(0, index);
      const int equal = keyval.indexOf('=');
      if (equal == -1) return parsed;
      String key = keyval.substring(0, equal);
      String val = keyval.substring(equal + 1);
      parsed[key] = val;
      return parsed;
    }
};

