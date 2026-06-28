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

max_wait = 15
current_wait = max_wait
while current_wait > 0:
    if wifi.isconnected():
        break
    print(f"Attempting to connect... ({max_wait - current_wait}/{max_wait})")
    time.sleep(1)
    current_wait -= 1

if wifi.isconnected():
    print("Connected to Wi-Fi !")
    print("Configuring Network:", wifi.ifconfig())
else:
    print("Impossible to connect to Wi-Fi")


# get ipv4 in a terminal with ipconfig
mqtt_server = "10.72.51.67"
port_server = 1883

# Accessibility test to port 1883 :
sock = socket.socket()
print("Connecting to broker...")
try:
    sock.connect((mqtt_server, port_server))  
    print("Connection OK")
except Exception as e:
    print("Connection Error:", e)
finally:
    sock.close()

# MQTT
client_id = "ESP32"
topic_temp = "temperature"
topic_hum = "humidity"
client = MQTTClient(client_id, mqtt_server, port=port_server)
client.connect()
print("Connected to broker MQTT")


sensor = dht.DHT11(Pin(32))

while True:
    try:
        sensor.measure() 
        temp = sensor.temperature()  # en °C
        hum = sensor.humidity()      # en %

        client.publish(topic_temp, str(temp))
        client.publish(topic_hum, str(hum))
        
        print("Data sended ! Temp: {}°C, Hum: {}%".format(temp, hum))
    except Exception as e:
        print("Error:", e)
    time.sleep(2)