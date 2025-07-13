import type { Disposable, ResourceManager } from '@/types';

/**
 * Resource Manager für automatische Ressourcen-Bereinigung
 * Stellt sicher, dass alle Ressourcen ordnungsgemäß freigegebene werden
 */
export class SimpleResourceManager implements ResourceManager {
  private readonly resources = new Set<Disposable>();
  private _isDisposed = false;

  public get isDisposed(): boolean {
    return this._isDisposed;
  }

  public addResource(resource: Disposable): void {
    if (this._isDisposed) {
      // Immediately dispose the resource if we're already disposed
      resource.dispose().catch(error => {
        console.error('Error disposing resource:', error);
      });
      return;
    }

    this.resources.add(resource);
  }

  public removeResource(resource: Disposable): void {
    if (this._isDisposed) {
      return;
    }

    this.resources.delete(resource);
  }

  public async dispose(): Promise<void> {
    if (this._isDisposed) {
      return;
    }

    this._isDisposed = true;

    // Dispose all resources in parallel
    const disposePromises = Array.from(this.resources).map(resource =>
      resource.dispose().catch(error => {
        console.error('Error disposing resource:', error);
      })
    );

    await Promise.all(disposePromises);
    this.resources.clear();
  }

  public get resourceCount(): number {
    return this.resources.size;
  }

  public hasResource(resource: Disposable): boolean {
    return this.resources.has(resource);
  }
} 