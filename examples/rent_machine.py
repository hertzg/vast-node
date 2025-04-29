#!/usr/bin/env python3

import argparse
import json
import time
import sys

# Assuming vast.py is in the parent directory and can be imported
# In a real scenario, you might install the vastai package via pip
try:
    from vast import VastClient, apiurl, apiheaders, http_get, http_put, parse_query, display_table, offers_fields, offers_alias, offers_mult, translate_null_strings_to_blanks
except ImportError:
    # Fallback for running directly from the vast-node directory
    sys.path.append('../')
    from vast import VastClient, apiurl, apiheaders, http_get, http_put, parse_query, display_table, offers_fields, offers_alias, offers_mult, translate_null_strings_to_blanks

# API key for testing
API_KEY = '43866bfbb34e8c810d58987bad96ea6bde3e5d0f29def48337462b4e4d4d94c3'

# Configuration for the machine rental
config = {
    # Machine search criteria (using snake_case for Python client)
    "search_criteria": {
        "num_gpus": 1,                # Number of GPUs
        "min_bid": 0.05,              # Minimum bid price per hour (lower is cheaper)
        "order": 'dph_total+',     # Sort by price, cheapest first
        "reliability": 0.95,         # Min 95% reliability
        "direct_port_count": 1,        # Needs at least 1 direct port
        "external": "false"            # Not an external machine (API expects string "false")
    },

    # Instance configuration (using snake_case for Python client)
    "instance_config": {
        "image": 'pytorch/pytorch:2.0.0-cuda11.7-cudnn8-runtime', # Docker image
        "disk": 10,             # 10GB of disk space
        "jupyter": "true",          # Enable JupyterLab (API expects string "true")
        "env": 'JUPYTER_PASSWORD=vastai-demo,DEMO_VAR="Hello from VAST.ai!"', # Environment variables (API expects comma-separated string)
        "onstart_cmd": 'echo "Container is running! Current time: $(date)" >> /vast/welcome.log' # Run command
    }
}

# Simple args object to mimic argparse for apiurl and http functions
class MockArgs:
    def __init__(self, api_key, server_url="https://console.vast.ai", retry=3, curl=False, raw=False, explain=False):
        self.api_key = api_key
        self.server_url = server_url
        self.retry = retry
        self.curl = curl
        self.raw = raw
        self.explain = explain
        # Add other attributes that apiurl/http functions might expect if needed
        self.onstart = None # Used by create__instance
        self.entrypoint = None # Used by create__instance
        self.login = None # Used by create__instance
        self.python_utf8 = False # Used by create__instance
        self.lang_utf8 = False # Used by create__instance
        self.jupyter_lab = False # Used by create__instance
        self.jupyter_dir = None # Used by create__instance
        self.force = False # Used by create__instance
        self.cancel_unavail = False # Used by create__instance
        self.template_hash = None # Used by create__instance
        self.user = None # Used by create__instance
        self.args = None # Used by create__instance
        self.bid_price = None # Used by create__instance

    # Add attributes from instance_config to MockArgs for create__instance
    def __getattr__(self, name):
        if name in config["instance_config"]:
            return config["instance_config"][name]
        raise AttributeError(f"'MockArgs' object has no attribute '{name}'")


# Sleep function for waiting periods
def sleep(ms):
    time.sleep(ms / 1000.0)

def create_instance(args, offer_id):
    """Mimics the create__instance function from vast.py"""
    runtype = None # Simplified, vast.py has logic to determine runtype

    json_blob ={
        "client_id": "me",
        "image": args.image,
        "env" : args.env, # parse_env is called inside vast.py's create__instance
        "price": args.bid_price,
        "disk": args.disk,
        "label": args.label,
        "extra": args.extra,
        "onstart": args.onstart_cmd,
        "image_login": args.login,
        "python_utf8": args.python_utf8,
        "lang_utf8": args.lang_utf8,
        "use_jupyter_lab": args.jupyter_lab,
        "jupyter_dir": args.jupyter_dir,
        "force": args.force,
        "cancel_unavail": args.cancel_unavail,
        "template_hash_id" : args.template_hash,
        "user": args.user
    }

    # Add machine_id to the payload
    json_blob["machine_id"] = offer_id

    url = apiurl(args, "/asks/{id}/".format(id=offer_id))

    print(f"Creating instance with payload: {json.dumps(json_blob, indent=2)}")

    r = http_put(args, url,  headers=apiheaders(args), json=json_blob)
    r.raise_for_status()
    return r.json()


def get_instance(args, instance_id):
    """Mimics getting instance details"""
    url = apiurl(args, "/instances/{id}".format(id=instance_id))
    r = http_get(args, url, headers=apiheaders(args))
    r.raise_for_status()
    return r.json()

def stop_instance(args, instance_id):
    """Mimics stopping an instance"""
    url = apiurl(args, "/instances/{id}/stop".format(id=instance_id))
    r = http_put(args, url, headers=apiheaders(args))
    r.raise_for_status()
    return r.json()

def delete_instance(args, instance_id):
    """Mimics deleting an instance"""
    url = apiurl(args, "/instances/{id}".format(id=instance_id))
    r = http_del(args, url, headers=apiheaders(args))
    r.raise_for_status()
    return r.json()


async def rent_machine():
    # Create a mock args object
    args = MockArgs(api_key=API_KEY)

    instance_id = None

    try:
        print('VAST.ai Machine Rental Example (Python)')
        print('======================================')

        # STEP 1: Search for available machines matching our criteria
        print('\n1. Searching for available machines...')
        search_url = apiurl(args, "/bundles", config["search_criteria"])
        search_results_response = http_get(args, search_url, headers=apiheaders(args))
        search_results_response.raise_for_status()
        search_results = search_results_response.json()

        # Extract the offers list
        offers = search_results.get('offers', [])

        if not offers:
            raise Exception('No suitable machines found matching criteria')

        print(f"Found {len(offers)} machines matching criteria")

        # STEP 2: Select the best machine (first in the list since we sorted by price)
        selected_machine = offers[0]
        machine_id = selected_machine['id']
        price = selected_machine.get('dph_total', 'unknown')
        gpu_name = selected_machine.get('gpu_name', 'Unknown GPU')
        gpu_count = selected_machine.get('num_gpus', 1)

        print(f"\n2. Selected machine #{machine_id}:")
        print(f"   - GPU: {gpu_name} ({gpu_count}x)")
        print(f"   - Price: ${price}/hr")

        # STEP 3: Create an instance on the selected machine
        print('\n3. Creating instance on selected machine...')

        # Use the create_instance helper function
        instance_creation_result = create_instance(args, machine_id)
        instance_id = instance_creation_result.get('new_contract')

        if not instance_id:
             raise Exception(f"Failed to create instance: {instance_creation_result.get('error', 'Unknown error')}")

        print(f"   Instance created successfully! ID: {instance_id}")

        # STEP 4: Start the instance (create_instance often starts it, but explicitly calling start is safer)
        print('\n4. Starting the instance...')
        # The create_instance call above should handle starting, but if not, uncomment below:
        # start_result = start_instance(args, instance_id)
        # print('   Start command sent successfully')


        # STEP 5: Monitor instance status
        print('\n5. Monitoring instance status...')
        is_running = False
        attempts = 0
        max_attempts = 20 # Increased attempts for potentially longer startup

        while not is_running and attempts < max_attempts:
            attempts += 1
            print(f"   Checking status (attempt {attempts}/{max_attempts})...")

            # Get the latest instance information
            instance_status = get_instance(args, instance_id)
            status = instance_status.get('actual_status', 'unknown')
            print(f"   Current status: {status}")

            if status == 'running':
                is_running = True

                # Display connection information
                ssh_host = instance_status.get('ssh_host', 'unknown')
                ssh_port = instance_status.get('ssh_port', 0)
                jupyter_url = instance_status.get('jupyter_url', None)

                print('\n6. Instance is now running!')
                print('   Connection Information:')
                print(f"   - SSH: ssh -p {ssh_port} root@{ssh_host}")

                if jupyter_url:
                    print(f"   - JupyterLab: {jupyter_url}")

                print('\n   Your instance is now ready to use!')
                print('   It will continue running and incurring charges until you stop it.')
                print('   To stop and delete this instance, uncomment the cleanup code below.')
            else:
                # Wait 15 seconds before checking again
                print('   Instance not ready yet. Waiting 15 seconds...')
                sleep(15000)

        if not is_running:
            print('\n   The instance failed to reach running status after multiple attempts.')
            print('   You may need to check the VAST.ai console for more information.')

        # STEP 6: Cleanup (commented out to prevent accidental deletion)
        # In a real application, you would stop and delete the instance when done
        """
        print('\n7. Cleaning up (stopping and deleting instance)...')

        # Stop the instance
        stop_result = stop_instance(args, instance_id)
        print('   Instance stopped successfully')

        # Delete the instance
        delete_result = delete_instance(args, instance_id)
        print('   Instance deleted successfully')
        """

        # Instead of automatic cleanup, show how to do it manually
        print('\n7. Manual Cleanup Instructions:')
        print('   When you are finished with this instance, clean it up with:')
        print(f"""
    # To stop the instance:
    vastai stop instance {instance_id}

    # To delete the instance:
    vastai destroy instance {instance_id}
        """)


    except Exception as e:
        print(f"\nERROR: {e}")

        # If we created an instance but encountered an error, provide cleanup instructions
        if instance_id:
            print('\nCleanup Instructions:')
            print(f"Since an error occurred, you may need to manually clean up instance #{instance_id}")
            print(f"""
    # To stop and delete the instance:
    vastai stop instance {instance_id}
    vastai destroy instance {instance_id}
            """)


# Run the example
if __name__ == "__main__":
    import asyncio
    asyncio.run(rent_machine())