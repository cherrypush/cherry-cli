if [ ! -d "test/fixtures/project-one/.git" ]; then
  # Create an empty test/fixtures/project-one directory
  mkdir -p test/fixtures/project-one

  # Initialize a git repository in the directory
  cd test/fixtures/project-one
  git init --initial-branch=main

  # Setup git user if in the CI environment
  if [ -n "$CI" ]; then
    echo "Setting up git user for CI environment"
    git config --local user.email "ci@example.com"
    git config --local user.name "CI Bot"
  fi

  # Create a dummy commit
  echo "test" > README.md
  git add README.md
  git commit -m "Initial commit"

  # Create a directory to act as the fake remote
  mkdir -p ../fake-remote

  # Initialize a bare repository in the fake remote directory
  git init --bare ../fake-remote

  # Add the fake remote to the current project
  git remote add origin ../fake-remote

  # Push the local branch (main) to the fake remote
  git push origin main

  # Set the remote's HEAD to point to the main branch
  git remote set-head origin main

  # Verify the setup by checking the remote HEAD
  git rev-parse --abbrev-ref origin/HEAD

  # Get back to the root directory
  cd ../../..
fi





