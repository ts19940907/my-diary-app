import json, boto3, os, io, csv

s3 = boto3.client('s3')
BUCKET_NAME = os.getenv('S3_BUCKET_NAME', 'my-diary-backup-2026-unique')

def lambda_handler(event, context):
    # 届いたデータの中身をログに出力（デバッグ用）
    print(f"Received event: {json.dumps(event)}")

    # App Runnerから送られてくるデータを受け取る
    diary_list = event 
        
    if not diary_list or not isinstance(diary_list, list):
        return {'statusCode': 400, 'body': 'No data list received'} 

    file_name = "diaries/diary_backup.csv"
    output = io.StringIO()
    fieldnames = ['id', '実施した業務', '課題点', '解決策', '日付']
    writer = csv.DictWriter(output, fieldnames=fieldnames)

    writer.writeheader()
    for row in diary_list:
        # 必要な項目だけを抽出して書き込み
        writer.writerow({k: row.get(k, "") for k in fieldnames})

    csv_content = output.getvalue()
    
    if action_type == 'save':
        # S3に保存
        s3.put_object(
            Bucket=bucket_name,
            Key=file_name,
            Body=csv_content.encode('utf-8-sig'), # Excel用のBOM付きUTF-8
            ContentType='text/csv'
        )
    elif action_type == 'delete':
        # S3からも削除
        s3.delete_object(Bucket=bucket_name, Key=file_name)
        
    return {'statusCode': 200}