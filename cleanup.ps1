param (
  [string]$UserInitials
)

if ([string]::IsNullOrWhiteSpace($UserInitials)) {
  Write-Host "Error: 'UserInitials' parameter is required. Please provide it with -UserInitials 'XX'"
  exit 1
}

$FunctionName = "$UserInitials-message-handler-lambda"
$LogGroupName = "/aws/lambda/$FunctionName"

Write-Host "Checking for log group: $LogGroupName"
try {
  $logExists = aws logs describe-log-groups --log-group-name-prefix $LogGroupName | ConvertFrom-Json
  if ($logExists.logGroups.Count -gt 0) {
    Write-Host "Deleting Log Group: $LogGroupName"
    aws logs delete-log-group --log-group-name $LogGroupName
    Write-Host "Log group deleted."
  } else {
    Write-Host "ℹLog group not found, skipping."
  }
} catch {
  Write-Host "Error: Failed to check or delete log group: $_"
}

Write-Host "Checking for Lambda Function: $FunctionName"
try {
  $lambdaExists = aws lambda get-function --function-name $FunctionName 2>$null
  if ($?) {
    Write-Host "Deleting Lambda Function: $FunctionName"
    aws lambda delete-function --function-name $FunctionName
    Write-Host "Lambda function deleted."
  } else {
    Write-Host "Lambda not found, skipping."
  }
} catch {
  Write-Host "Error: Failed to check or delete Lambda: $_"
}

Write-Host "Searching for matching API Gateway IDs..."
try {
  $gateways = aws apigateway get-rest-apis --query "items[?starts_with(name, '$UserInitials')].[id,name]" --output json | ConvertFrom-Json
  if ($gateways.Count -gt 0) {
    foreach ($gateway in $gateways) {
      $id = $gateway[0]
      $name = $gateway[1]
      Write-Host "Deleting API Gateway: $name ($id)"
      aws apigateway delete-rest-api --rest-api-id $id
    }
    Write-Host "API Gateways deleted."
  } else {
    Write-Host "ℹNo matching API Gateways found, skipping."
  }
} catch {
  Write-Host "Error: Failed to find or delete API Gateways: $_"
}

Write-Host "Cleanup complete."