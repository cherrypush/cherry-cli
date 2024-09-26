import Codeowners from 'codeowners'

// Create a subclass of Codeowners
class ExtendedCodeowners extends Codeowners {
  getOwners: typeof this.getOwner

  constructor(...args: ConstructorParameters<typeof Codeowners>) {
    super(...args)
    // Point getOwners to the getOwner method (for backwards compatibility)
    this.getOwners = this.getOwner
  }
}

export default ExtendedCodeowners
