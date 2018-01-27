import RPi.GPIO as GPIO
import time
import paho.mqtt.client as mqtt
import paho.mqtt.publish as publish
import wifi_connector as wifi
import serial

Broker_ip = "192.168.0.10"
Broker_port = 1883

id = "SENSOR_0"

pub_topic = "smartglow/light-sensor/" + id + "/update"

ser = serial.Serial('/dev/ttyACM0', 9600)

def read_light():
	return ser.readline()

def on_connect(client, userdata, flags, rc):
    print("Connected with result code "+str(rc))

def on_message(client, userdata, msg):
    message = str(msg.payload)
    print(msg.topic+" "+message)

def on_publish(mosq, obj, mid):
    print("mid: " + str(mid))

client = mqtt.Client()
client.on_connect = on_connect
client.on_message = on_message
client.connect(Broker_ip, Broker_port)
client.loop_start()

while True:
    sensor_data = read_light()
    client.publish(pub_topic, str(sensor_data.strip()))
    time.sleep(1)