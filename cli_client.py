#!/usr/bin/env python3
"""
CLI Client for CLI-to-Web Bridge

A command-line interface that sends messages to the bridge server
and displays AI responses in the terminal.

Usage:
    python cli_client.py "Your message here"
    python cli_client.py --message "Your message here" -p chatgpt
    python cli_client.py --platform gemini -m "Your question"
    python cli_client.py --switch-platform claude
    python cli_client.py --list-platforms
    python cli_client.py --health
"""

import sys
import json
import argparse
from typing import Optional

try:
    import requests
except ImportError:
    print("Error: 'requests' library not installed.")
    print("Install it with: pip install requests")
    sys.exit(1)


# Configuration
SERVER_URL = "http://127.0.0.1:8000"
SEND_ENDPOINT = f"{SERVER_URL}/send"
HEALTH_ENDPOINT = f"{SERVER_URL}/health"
PLATFORMS_ENDPOINT = f"{SERVER_URL}/platforms"
SWITCH_PLATFORM_ENDPOINT = f"{SERVER_URL}/switch-platform"
TIMEOUT_SECONDS = 120  # Match server timeout for long AI responses


def check_server_health() -> bool:
    """
    Check if the bridge server is running and healthy.

    Returns:
        True if server is healthy, False otherwise
    """
    try:
        response = requests.get(HEALTH_ENDPOINT, timeout=5)
        if response.status_code == 200:
            data = response.json()
            if data.get("status") == "healthy":
                return True
        return False
    except requests.exceptions.ConnectionError:
        return False
    except requests.exceptions.Timeout:
        return False
    except Exception:
        return False


def send_message(message: str, platform: Optional[str] = None) -> Optional[dict]:
    """
    Send a message to the bridge server and get the AI response.

    Args:
        message: The text message to send to the AI
        platform: Optional platform override ("chatgpt", "gemini", "claude")

    Returns:
        dict with response data, or None if an error occurred
    """
    try:
        payload = {"message": message}
        if platform:
            payload["platform"] = platform
        
        response = requests.post(
            SEND_ENDPOINT,
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=TIMEOUT_SECONDS
        )

        if response.status_code != 200:
            print(f"\n❌ Server error (HTTP {response.status_code})")
            try:
                error_data = response.json()
                print(f"   Details: {error_data.get('detail', 'Unknown error')}")
            except json.JSONDecodeError:
                print(f"   Details: {response.text}")
            return None

        # Parse response
        data = response.json()
        
        if not data.get("success", False):
            error_msg = data.get("error", "Unknown error")
            print(f"\n❌ Error: {error_msg}")
            return None

        return data  # Return full data dict including platform info

    except requests.exceptions.ConnectionError:
        print("\n❌ Connection Error: Could not connect to the bridge server.")
        print("   Make sure the server is running:")
        print("   python bridge_server.py")
        return None
    except requests.exceptions.Timeout:
        print("\n❌ Timeout Error: The request took too long.")
        print("   The AI might be processing a complex response.")
        print("   Try again or increase the timeout setting.")
        return None
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        return None


def list_platforms() -> Optional[dict]:
    """Get list of supported platforms."""
    try:
        response = requests.get(PLATFORMS_ENDPOINT, timeout=5)
        if response.status_code == 200:
            return response.json()
        return None
    except Exception as e:
        print(f"Error listing platforms: {e}")
        return None


def switch_platform(platform: str) -> bool:
    """Switch to a different platform."""
    try:
        response = requests.post(
            SWITCH_PLATFORM_ENDPOINT,
            json={"platform": platform},
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Switched to {platform}: {data.get('url', '')}")
            return True
        else:
            error_data = response.json()
            print(f"❌ Failed to switch: {error_data.get('detail', 'Unknown error')}")
            return False
    except Exception as e:
        print(f"Error switching platform: {e}")
        return False


def format_response(response: str, width: int = 80) -> str:
    """
    Format the AI response for nice terminal display.

    Args:
        response: The raw response text
        width: Maximum line width for wrapping

    Returns:
        Formatted response string
    """
    if not response:
        return "(Empty response)"

    # Add border and formatting
    lines = response.split('\n')
    formatted_lines = []
    
    for line in lines:
        # Simple word wrapping for long lines
        if len(line) > width:
            words = line.split()
            current_line = ""
            for word in words:
                if len(current_line) + len(word) + 1 <= width:
                    current_line += (" " if current_line else "") + word
                else:
                    if current_line:
                        formatted_lines.append(current_line)
                    current_line = word
            if current_line:
                formatted_lines.append(current_line)
        else:
            formatted_lines.append(line)

    return '\n'.join(formatted_lines)


def interactive_mode(platform: Optional[str] = None):
    """
    Run the CLI in interactive mode, allowing multiple messages
    in a single session.
    
    Args:
        platform: Optional platform to use for all messages
    """
    print("\n" + "=" * 60)
    print("🤖 CLI-to-Web Bridge - Interactive Mode")
    if platform:
        print(f"   Platform: {platform}")
    print("=" * 60)
    print("Type your messages and press Enter to send.")
    print("Type 'quit' or 'exit' to stop.")
    print("Type 'platform <name>' to switch (chatgpt, gemini, claude)")
    print("-" * 60)

    current_platform = platform

    while True:
        try:
            # Get user input
            user_input = input("\n📝 You: ").strip()
            
            if not user_input:
                continue
            
            if user_input.lower() in ('quit', 'exit', 'q'):
                print("\n👋 Goodbye!")
                break
            
            # Check for platform switch command
            if user_input.lower().startswith('platform '):
                new_platform = user_input.split(' ', 1)[1].strip().lower()
                if new_platform in ['chatgpt', 'gemini', 'claude']:
                    if switch_platform(new_platform):
                        current_platform = new_platform
                    continue
                else:
                    print(f"❌ Invalid platform. Use: chatgpt, gemini, or claude")
                    continue

            # Send message
            print("\n⏳ Waiting for AI response...")
            result = send_message(user_input, platform=current_platform)

            # Display response
            if result:
                print("\n" + "-" * 60)
                print(f"🤖 AI Response ({result.get('platform', 'unknown')}):")
                print("-" * 60)
                print(format_response(result.get('response', '')))
                print("-" * 60)

        except KeyboardInterrupt:
            print("\n\n👋 Interrupted. Goodbye!")
            break
        except EOFError:
            print("\n\n👋 Goodbye!")
            break


def main():
    """Main entry point for the CLI client."""
    parser = argparse.ArgumentParser(
        description="CLI Client for AI Chat Bridge",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s "What is quantum computing?"
  %(prog)s -m "Explain relativity" -p chatgpt
  %(prog)s --platform gemini -m "Hello"
  %(prog)s --switch-platform claude
  %(prog)s --list-platforms
  %(prog)s --health
  %(prog)s -i  (interactive mode)
        """
    )

    parser.add_argument(
        "message",
        nargs="?",
        help="The message to send to the AI"
    )
    parser.add_argument(
        "-m", "--message-flag",
        dest="message_flag",
        help="Alternative way to provide the message"
    )
    parser.add_argument(
        "-p", "--platform",
        dest="platform",
        choices=["chatgpt", "gemini", "claude"],
        help="AI platform to use (chatgpt, gemini, claude)"
    )
    parser.add_argument(
        "-i", "--interactive",
        action="store_true",
        help="Run in interactive mode (multiple messages)"
    )
    parser.add_argument(
        "--health",
        action="store_true",
        help="Check if the server is running and show status"
    )
    parser.add_argument(
        "--list-platforms",
        action="store_true",
        help="List all supported platforms"
    )
    parser.add_argument(
        "--switch-platform",
        dest="switch_to",
        choices=["chatgpt", "gemini", "claude"],
        help="Switch to a different platform"
    )
    parser.add_argument(
        "--server-url",
        default=SERVER_URL,
        help=f"Server URL (default: {SERVER_URL})"
    )

    args = parser.parse_args()

    # Update server URL if provided
    global SERVER_URL, SEND_ENDPOINT, HEALTH_ENDPOINT, PLATFORMS_ENDPOINT, SWITCH_PLATFORM_ENDPOINT
    if args.server_url != SERVER_URL:
        SERVER_URL = args.server_url
        SEND_ENDPOINT = f"{SERVER_URL}/send"
        HEALTH_ENDPOINT = f"{SERVER_URL}/health"
        PLATFORMS_ENDPOINT = f"{SERVER_URL}/platforms"
        SWITCH_PLATFORM_ENDPOINT = f"{SERVER_URL}/switch-platform"

    # Check health mode
    if args.health:
        print("Checking server health...")
        try:
            response = requests.get(HEALTH_ENDPOINT, timeout=5)
            if response.status_code == 200:
                data = response.json()
                print("✅ Server is healthy and running!")
                print(f"   Platform: {data.get('platform', 'unknown')}")
                print(f"   URL: {data.get('url', 'unknown')}")
                sys.exit(0)
            else:
                print("❌ Server returned unhealthy status")
                sys.exit(1)
        except requests.exceptions.ConnectionError:
            print("❌ Server is not responding.")
            print("   Make sure bridge_server.py is running.")
            sys.exit(1)

    # List platforms mode
    if args.list_platforms:
        platforms = list_platforms()
        if platforms:
            print("\n📋 Supported Platforms:")
            print("=" * 40)
            for platform in platforms.get('supported_platforms', []):
                current = " (current)" if platform == platforms.get('current_platform') else ""
                url = platforms.get('selectors_info', {}).get(platform, '')
                print(f"   • {platform}{current}")
                print(f"     → {url}")
            print("=" * 40)
            sys.exit(0)
        else:
            print("❌ Could not fetch platforms. Is server running?")
            sys.exit(1)

    # Switch platform mode
    if args.switch_to:
        if switch_platform(args.switch_to):
            sys.exit(0)
        else:
            sys.exit(1)

    # Interactive mode
    if args.interactive:
        # Check server first
        if not check_server_health():
            print("❌ Cannot connect to bridge server at", SERVER_URL)
            print("   Make sure bridge_server.py is running.")
            sys.exit(1)
        interactive_mode(platform=args.platform)
        sys.exit(0)

    # Single message mode
    message = args.message or args.message_flag

    if not message:
        parser.print_help()
        print("\n❌ Error: No message provided.")
        print("   Use: python cli_client.py \"Your message\"")
        print("   Or:  python cli_client.py --interactive")
        sys.exit(1)

    # Check server health before sending
    if not check_server_health():
        print("❌ Cannot connect to bridge server at", SERVER_URL)
        print("   Make sure bridge_server.py is running:")
        print("   python bridge_server.py")
        sys.exit(1)

    # Send message and display response
    platform_info = f" [{args.platform}]" if args.platform else ""
    print(f"⏳ Sending message to AI{platform_info}...")
    result = send_message(message, platform=args.platform)

    if result:
        print("\n" + "=" * 60)
        print(f"🤖 AI Response ({result.get('platform', 'unknown')})")
        print("=" * 60)
        print(format_response(result.get('response', '')))
        print("=" * 60)
        sys.exit(0)
    else:
        sys.exit(1)


if __name__ == "__main__":
    main()
