import os
import pickle
import logging

if __name__ == "__main__":
    try:
        # Get current file directory (backend/)
        BASE_DIR = os.path.dirname(os.path.abspath(__file__))

        # Build path to part_encoder.pkl
        encoder_path = os.path.join(
            BASE_DIR,
            "..",
            "MNAO",
            "TEST_MODEL_en_51485",
            "part_encoder.pkl"
        )

        encoder_path = os.path.normpath(encoder_path)

        # Load encoder
        with open(encoder_path, "rb") as f:
            part_encoder = pickle.load(f)

        # Count total parts
        total_parts = len(part_encoder.classes_)
        print("✅ Total number of parts in part_encoder.pkl:", total_parts)

        # Check specific part
        part_no = "0000-11-0194"
        part_no_clean = part_no.strip()

        if part_no_clean in part_encoder.classes_:
            encoded_value = part_encoder.transform([part_no_clean])[0]
            print(f"✅ Part number '{part_no_clean}' EXISTS")
            print("Encoded value:", encoded_value)
        else:
            print(f"❌ Part number '{part_no_clean}' NOT FOUND")

    except FileNotFoundError:
        logging.error("❌ part_encoder.pkl not found. Check folder structure.")
    except Exception as e:
        logging.error(f"❌ Error loading part_encoder.pkl: {e}", exc_info=True)
