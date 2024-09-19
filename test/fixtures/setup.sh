# SUPER PROJECT SETUP
if [ ! -d "test/fixtures/super-project-source/.git" ]; then
  # Copy the testing sample repo into a new folder
  cp -r test/fixtures/super-project test/fixtures/super-project-source

  # Initialize a git repository in the directory
  cd test/fixtures/super-project-source
  git init --initial-branch=main

  # Setup git user if in the CI environment
  if [ -n "$CI" ]; then
    echo "Setting up git user for CI environment..."
    git config --local user.email "ci@example.com"
    git config --local user.name "CI Bot"
  fi

  # Create a dummy commit
  echo "test" > README.md
  git add .
  git commit -m "Initial commit"

  # Create a directory to act as the fake remote
  echo "Setting up a fake remote..."
  mkdir -p ../super-project-remote
  git init --bare ../super-project-remote --initial-branch=main
  git remote add origin ../super-project-remote

  # Push the local branch (main) to the fake remote
  git push origin main

  # Set the remote's HEAD to point to the main branch
  git remote set-head origin main

  # Verify the setup by checking the remote HEAD
  git rev-parse --abbrev-ref origin/HEAD

  # Get back to the root directory
  cd ../../..
fi

# EMPTY PROJECT SETUP
if [ ! -d "test/fixtures/empty-project-source/.git" ]; then
  # Create a new directory to act as the empty project
  mkdir -p test/fixtures/empty-project-source
  cd test/fixtures/empty-project-source
  git init --initial-branch=main

  # Setup git user if in the CI environment
  if [ -n "$CI" ]; then
    echo "Setting up git user for CI environment..."
    git config --local user.email "ci@example.com"
    git config --local user.name "CI Bot"
  fi

  # Create a dummy commit
  echo "test" > README.md
  git add .
  git commit -m "Initial commit"

  # Create a directory to act as the fake remote
  echo "Setting up a fake remote..."
  mkdir -p ../empty-project-remote
  git init --bare ../empty-project-remote --initial-branch=main
  git remote add origin ../empty-project-remote

  # Push the local branch (main) to the fake remote
  git push origin main

  # Set the remote's HEAD to point to the main branch
  git remote set-head origin main

  # Verify the setup by checking the remote HEAD
  git rev-parse --abbrev-ref origin/HEAD

  # Get back to the root directory
  cd ../../..
fi
