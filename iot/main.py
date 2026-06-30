import network
import time
from umqtt.simple import MQTTClient
import socket
import dht
from machine import Pin

SSID = ""
PASSWORD = ""

wifi = network.WLAN(network.STA_IF)
wifi.active(True)
wifi.connect(SSID, PASSWORD)

max_wait = 100
current_wait = 0
while not wifi.isconnected() or current_wait < max_wait:
    print(f"Attempting to connect... ({current_wait})")
    time.sleep(1)
    current_wait += 1


# get ipv4 in a terminal with ipconfig
mqtt_server = ""
port_server = 1883

# Accessibility test to port 1883 :
sock = socket.socket()
print("Connecting to broker...")
connect_broker = False
while connect_broker== False:
    try:
        sock.connect((mqtt_server, port_server))  
        print("Connection OK")
        connect_broker = True
    except Exception as e:
        print("Connection Error:", e)

# MQTT
client_id = "ESP32"
topic_temp = "temperature"
topic_hum = "humidity"
client = MQTTClient(client_id, mqtt_server, port=port_server)
client.connect()
print("Connected to broker MQTT")


sensor = dht.DHT11(Pin(32))

while True:
    if not wifi.isconnected():
        print("WiFi disconnected, trying to reconnect...")
        wifi.connect(SSID, PASSWORD)
        while not wifi.isconnected():
            time.sleep(1)
        print("Reconnected to WiFi.")
    if not client.sock:
        print("MQTT client disconnected, trying to reconnect...")
        try:
            client.connect()
            print("Reconnected to MQTT broker.")
        except Exception as e:
            print("MQTT reconnection error:", e)
            time.sleep(5)
            continue
    try:
        sensor.measure() 
        temp = sensor.temperature()  # en °C
        hum = sensor.humidity()      # en %

        client.publish(topic_temp, str(temp))
        client.publish(topic_hum, str(hum))
        
        print("Data sended ! Temp: {}°C, Hum: {}%".format(temp, hum))
    except Exception as e:
        print("Error:", e)
    time.sleep(5)