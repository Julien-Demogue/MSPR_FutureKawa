# IoT - ESP32

Script MicroPython pour ESP32 qui se connecte au Wi-Fi, interroge un capteur DHT11 et publie les mesures sur un broker MQTT.

## Configuration

Avant de lancer le script, modifie les variables suivantes dans [main.py](main.py) :

```python
SSID = ""
PASSWORD = ""
mqtt_server = "10.72.51.67"
port_server = 1883
```

Renseigne :

1. un SSID et un mot de passe valides pour le réseau Wi-Fi de la carte.
2. l'adresse IP ou le nom d'hôte du serveur MQTT.
3. le port du broker MQTT.

## Prérequis

- Un microcontrôleur ESP32
- Un capteur DHT11 branché sur la broche GPIO 32
- Le driver USB-to-UART Silicon Labs : https://www.silabs.com/software-and-tools/usb-to-uart-bridge-vcp-drivers?tab=downloads
- L'IDE Thonny

## Installation

1. Installe le driver Silicon Labs.
2. Branche l'ESP32 au PC.
3. Ouvre Thonny.
4. Va dans `Tools` > `Options` > `Interpreter`.
5. Sélectionne `MicroPython (ESP32)`.
6. Choisis le port série correspondant au driver installé.

## Déploiement sur la carte

1. Ouvre le fichier [main.py](main.py) dans Thonny.
2. Fais un `Save as` vers le microcontrôleur.
3. Écrase le fichier `main.py` sur la carte.

## Attention

Ne pas écraser `root.py`.