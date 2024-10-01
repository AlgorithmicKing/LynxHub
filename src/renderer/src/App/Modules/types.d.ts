export type AvailablePages = '/imageGenerationPage' | '/textGenerationPage' | '/audioGenerationPage';

export type InstallationMethod = {chosen: 'install' | 'locate'; targetDirectory?: string};
export type UserInputFieldType = 'checkbox' | 'text-input' | 'select' | 'directory' | 'file';
export type UserInputField = {id: string; label: string; type: UserInputFieldType; selectOptions?: string[]};
export type UserInputResult = {id: string; result: string | boolean};
export type InstallationStepper = {
  /** Initialize the installation process by setting up the required steps.
   * @param stepTitles An array of step titles representing the installation workflow.
   */
  initialSteps: (stepTitles: string[]) => void;

  /** Advance to the next step in the installation process. */
  nextStep: () => void;

  /** Normally the first step (Contain locating or start installation)
   * @return A promise resolving to the user's choice of installation method.
   */
  starterStep: () => Promise<InstallationMethod>;

  /** Clone a Git repository to a user-selected directory.
   * @param repositoryUrl The URL of the Git repository to clone.
   * @returns A promise resolving to the path of the cloned repository.
   */
  cloneRepository: (url: string) => Promise<string>;

  /** Execute a terminal script file.
   * @param workingDirectory The directory in which to execute the script.
   * @param scriptFileName The name of the script file to execute.
   * @returns A promise that resolves when execution is complete and the user proceeds.
   */
  runTerminalScript: (workingDirectory: string, scriptFileName: string) => Promise<void>;

  /** Execute one or more terminal commands.
   * @param commands A single command or an array of commands to execute.
   * @param workingDirectory Optional directory in which to execute the commands.
   * @returns A promise that resolves when execution is complete and the user proceeds.
   */
  executeTerminalCommands: (commands: string | string[], workingDirectory?: string) => Promise<void>;

  /** Download a file from a given URL.
   * @param fileUrl The URL of the file to download.
   * @returns A promise resolving to the path of the downloaded file.
   */
  downloadFileFromUrl: (fileUrl: string) => Promise<string>;

  /** Call this when installation is done to set the card installed
   * @param dir The directory to save
   */
  setInstalled: (dir: string) => void;

  /** Collect user input for various configuration options.
   * @param inputFields An array of input fields to present to the user.
   * @returns A promise resolving to an array of user input results.
   */
  collectUserInput: (inputFields: UserInputField[]) => Promise<UserInputResult[]>;

  /** Display the final step of the installation process with a result message.
   * @param resultType The type of result: 'success' or 'error'.
   * @param resultTitle A title summarizing the result.
   * @param resultDescription An optional detailed description of the result.
   */
  showFinalStep: (resultType: 'success' | 'error', resultTitle: string, resultDescription?: string) => void;

  /** Utility functions that don't involve UI interaction */
  utils: {
    /** Decompress a file.
     * @param compressedFilePath The path to the compressed file.
     * @returns A promise resolving to the path of the decompressed data.
     */
    decompressFile: (compressedFilePath: string) => Promise<string>;

    /** Validate if a local directory matches a given Git repository URL.
     * @param localDirectory The local directory to validate.
     * @param repositoryUrl The Git repository URL to compare against.
     * @returns A promise resolving to true if the directory matches the repository, false otherwise.
     */
    validateGitRepository: (localDirectory: string, repositoryUrl: string) => Promise<boolean>;

    /** Check for the existence of specified files or folders in a directory.
     * @param directory The directory to search in.
     * @param itemNames An array of file or folder names to check for.
     * @returns A promise resolving to true if all items exist, false otherwise.
     */
    verifyFilesExist: (directory: string, itemNames: string[]) => Promise<boolean>;

    /** Open a file or folder using the system's default manner.
     * @param path Absolute path to open
     */
    openFileOrFolder: (itemPath: string) => void;
  };
};

/** These methods will be called in the renderer process */
export type CardRendererMethods = {
  /** This method will be called with terminal output line parameter
   * @return URL of running AI to be showing in browser of the user and
   * @return undefined if URL is not in that line */
  catchAddress?: (line: string) => string | undefined;

  /** Fetching and return array of available extensions in type of `ExtensionData` */
  fetchExtensionList?: () => Promise<ExtensionData[]>;

  /** Parse the given argument to string */
  parseArgsToString?: (args: ChosenArgument[]) => string;

  /** Parse given string to the arguments */
  parseStringToArgs?: (args: string) => ChosenArgument[];

  manager?: {
    startInstall: (stepper: InstallStepperType) => void;
    updater: {
      updateType: 'git' | 'stepper';
      startUpdate?: (stepper: InstallStepperType, dir: string) => void;
      updateAvailable?: () => boolean;
    };
  };
};

export type CardData = {
  /**  ID will be used to managing state of card */
  id: string;

  /**  Card background */
  bgUrl: string;

  /**  Url to repository (Using this url recognize, clone and update card) */
  repoUrl: string;

  /**  The title of card */
  title: string;

  /**  Description about what card does */
  description: string;

  /**  The directory of extension (In relative path like '/extensions')
   *   - Leave undefined if WebUI have no extension ability
   */
  extensionsDir?: string;

  /** Type of AI (Using type for things like discord activity status) */
  type?: 'image' | 'audio' | 'text' | 'unknown';

  /** List of all available arguments
   *  - Leave undefined if WebUI have no arguments to config
   */
  arguments?: ArgumentsData;

  /** These methods will be called in the renderer process
   * @description This methods will be used when user interaction (Like recognizing URL to show in browser)
   */
  methods: CardRendererMethods;
};

export type PagesData = {
  /** Router path (For placing the card in relative page) */
  routePath: AvailablePages;

  /** Cards data */
  cards: CardData[];
};

export type CardModules = PagesData[];

export type RendererModuleImportType = {
  default: CardModules;
  setCurrentBuild?: (build: number) => void;
};

export type ChosenArgument = {name: string; value: string};

export type ArgumentType = 'Directory' | 'File' | 'Input' | 'DropDown' | 'CheckBox';

export type ArgumentItem = {
  name: string;
  description?: string;
  type: ArgumentType;
  defaultValue?: any;
  values?: string[];
};

export type ArgumentSection = {
  section: string;
  items: ArgumentItem[];
};

export type ArgumentsData = (
  | {
      category: string;
      condition?: string;
      sections: ArgumentSection[];
    }
  | {
      category: string;
      condition?: string;
      items: ArgumentItem[];
    }
)[];
