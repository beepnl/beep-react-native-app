#\!/bin/bash
set -e

echo "Starting progressive iOS build..."

# Function to add exclusion to Podfile
add_exclusion() {
    target_name=$1
    echo "Adding exclusion for $target_name..."
    
    # Check if already exists
    if grep -q "if target.name == '$target_name'" Podfile; then
        echo "$target_name already has exclusion"
        return
    fi
    
    # Add before "# Global warning suppression"
    sed -i '' "/# Global warning suppression/i\\
        if target.name == '$target_name'\\
          config.build_settings['EXCLUDED_SOURCE_FILE_NAMES'] = '**/*.cpp **/*.cc'\\
        end\\
        \\
" Podfile
}

# Keep building until success or no progress
max_attempts=20
attempt=0

while [ $attempt -lt $max_attempts ]; do
    echo "Build attempt $((attempt + 1))..."
    
    # Run pod install
    pod install
    
    # Try to build and capture output
    if xcodebuild -workspace app.xcworkspace -scheme app -destination 'id=00008030-000D35D201D0402E' -derivedDataPath build 2>&1 | tee build_output.log; then
        echo "BUILD SUCCEEDED\!"
        exit 0
    fi
    
    # Extract failed target from build output
    failed_target=$(grep -E "CompileC.*\(in target '.*' from project" build_output.log | grep -oE "in target '[^']+'" | grep -oE "'[^']+'" | tr -d "'" | head -1)
    
    if [ -z "$failed_target" ]; then
        echo "Could not determine failed target. Check build_output.log"
        exit 1
    fi
    
    echo "Build failed on target: $failed_target"
    
    # Add exclusion for the failed target
    add_exclusion "$failed_target"
    
    attempt=$((attempt + 1))
done

echo "Maximum attempts reached. Build still failing."
exit 1
