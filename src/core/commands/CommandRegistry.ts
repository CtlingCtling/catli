export interface Command {
  name: string;
  description: string;
  execute: (args: string[]) => Promise<boolean>;
}

export class CommandRegistry {
  private commands: Map<string, Command> = new Map();

  register(command: Command): void {
    if (this.commands.has(command.name)) {
      throw new Error(`Command ${command.name} is already registered`);
    }
    this.commands.set(command.name, command);
  }

  get(name: string): Command | undefined {
    return this.commands.get(name);
  }

  list(): Command[] {
    return Array.from(this.commands.values());
  }

  has(name: string): boolean {
    return this.commands.has(name);
  }
}
