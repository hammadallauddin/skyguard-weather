#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Setup and publish SkyGuard Weather as a Claude Code plugin
.DESCRIPTION
    This script helps you:
    1. Initialize git repository (if not already done)
    2. Create a GitHub repository for the plugin
    3. Push code to GitHub
    4. Install the plugin in Claude Code
#>

param(
    [string]$GitHubUsername = "",
    [string]$RepoName = "skyguard-weather",
    [string]$PluginDisplayName = "skyguard-weather"
)

$ErrorActionPreference = "Stop"

Write-Host "`n=== SkyGuard Weather - Plugin Setup ===" -ForegroundColor Cyan
Write-Host ""

# Check if in the right directory
if (-not (Test-Path ".git")) {
    Write-Host "⚠️  This script must be run from the skyguard-weather project directory" -ForegroundColor Yellow
    exit 1
}

# Check if user provided GitHub username
if ([string]::IsNullOrWhiteSpace($GitHubUsername)) {
    Write-Host "Enter your GitHub username: " -NoNewline
    $GitHubUsername = Read-Host
}

$RepoUrl = "https://github.com/$GitHubUsername/$RepoName.git"

# Step 1: Initialize git (if needed)
if ((git status | Select-String "not a git repository") -or -not (Test-Path ".git")) {
    Write-Host "Initializing git repository..." -ForegroundColor Yellow
    git init -b main
    git add .
    git commit -m "Initial commit: SkyGuard Weather plugin"
}

# Step 2: Add remote and push
Write-Host "Adding GitHub remote: $RepoUrl" -ForegroundColor Yellow
git remote add origin $RepoUrl
git push -u origin main

# Step 3: Install in Claude Code
Write-Host ""
Write-Host "=== Installation Complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "Your plugin is now published at:" -ForegroundColor Cyan
Write-Host "  $RepoUrl" -ForegroundColor White
Write-Host ""
Write-Host "To install in Claude Code, run:" -ForegroundColor Cyan
Write-Host ""
Write-Host "  claude plugin marketplace add $GitHubUsername/$RepoName" -ForegroundColor Green
Write-Host "  claude plugin install skyguard-weather@skyguard" -ForegroundColor Green
Write-Host ""
Write-Host "Then restart Claude Code to activate the plugin." -ForegroundColor Cyan
Write-Host ""
Write-Host "Available commands after installation:" -ForegroundColor Cyan
Write-Host "  /check-weather [city]  - Check weather for any city" -ForegroundColor White
Write-Host "  get_weather MCP tool  - Fetch weather via MCP" -ForegroundColor White
Write-Host "  weather-investigator  - Agent for detailed weather checks" -ForegroundColor White
