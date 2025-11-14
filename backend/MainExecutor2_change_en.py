from BasicModelEnhanced2_change_en import load_data, preprocess_data, train_model, plot_feature_importance
import logging
import pandas as pd
import pickle
if __name__ == "__main__":
    try:
        """combined_list = []
        for dealer_code in ['10177']:
            logging.info("Loading data from PostgreSQL...")
            df = load_data(dealer_code)
            combined_list.append(df)
            #print(df)
        logging.info("Preprocessing data...")
        combined_df = pd.concat(combined_list,ignore_index=True)"""
        #'10131'->87%,'23454'->85%, '23925'->59.8%, '34318'->81%,'51485'->55%
        dealers = ["22218","11150","35130","46550","50210"]
        for dealer in dealers:
            df = load_data(dealer)
            X, y, df, _, _ = preprocess_data(df,dealer)
        
            # X,y,df =load_combined_training_data() 
            # print(df)
            # print(df['season'].dtype)
            
            #print(df)
            #X.describe()   

            logging.info("Training the model...")
            model, y_test, y_pred = train_model(X,y,dealer)

            # try:
            #     with open("./../TEST_MODEL_en/inventory_model_2.pkl", "rb") as f:
            #         model = pickle.load(f)
            # except FileNotFoundError as e:
            #     logging.error(f" Error loading model or encoders: {e}")
            #     exit()
            logging.info("Plotting Feature Importance...")
            plot_feature_importance(model)

            # logging.info("Evaluating the final model...")
            # evaluate_model(model, X, y)

            # logging.info("Model training and prediction process completed successfully!")

    except Exception as e:
        logging.error(f"Error during execution: {e}")