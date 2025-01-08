#!/bin/sh

TAG="genAccount.sh"
#interface="eth0"
interface="ens33"

# Extract the MAC address
if command -v ip &> /dev/null; then
    mac_address=$(ip link show "$interface" | awk '/ether/ {print $2}')
elif command -v ifconfig &> /dev/null; then
    mac_address=$(ifconfig "$interface" | awk '/ether/ {print $2}')
else
    logger -s "Neither ip nor ifconfig commands are available." -t $TAG
    exit 1
fi

# Check if MAC address was successfully retrieved
if [ -z "$mac_address" ]; then
    logger -s "Failed to retrieve MAC address for interface $interface." -t $TAG
    exit 1
fi

# Convert MAC address to uppercase
mac_address=$(echo "$mac_address" | tr '[:lower:]' '[:upper:]')

# Extract the last 3 bytes of the MAC address and remove colons
last_three_bytes=$(echo "$mac_address" | awk -F: '{print $(NF-2) $(NF-1) $NF}')

# Create the content string
content="admin:x:Getac$last_three_bytes"

# Write the content to a file
output_file="/tmp/genAccount"
echo "$content" > "$output_file"

# Output the result
logger -s "File '$output_file' created with content: $content" -t $TAG
