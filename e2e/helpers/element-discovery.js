/**
 * Element Discovery Helper
 * Safely discovers existing elements on pages to prevent test hanging
 */

export class ElementDiscovery {
  
  /**
   * Discover all interactive elements on a page without hanging
   * @param {Page} page - Playwright page object
   * @param {number} timeout - Max time to wait for elements (default: 2000ms)
   * @returns {Object} - Categorized elements found
   */
  static async discoverInteractiveElements(page, timeout = 2000) {
    const elements = {
      buttons: [],
      links: [],
      inputs: [],
      selects: [],
      textareas: [],
      checkboxes: [],
      radios: [],
      modals: [],
      navigation: [],
      errors: [],
      forms: []
    };

    try {
      // Discover buttons (various types)
      const buttonSelectors = [
        'button',
        '[role="button"]',
        'input[type="button"]',
        'input[type="submit"]',
        '[type="button"]'
      ];
      
      for (const selector of buttonSelectors) {
        try {
          const buttonElements = await page.locator(selector).all();
          for (const button of buttonElements) {
            const text = await button.textContent().catch(() => '');
            const isVisible = await button.isVisible().catch(() => false);
            if (isVisible) {
              elements.buttons.push({
                element: button,
                selector,
                text: text.trim(),
                type: 'button'
              });
            }
          }
        } catch (error) {
          // Skip if selector doesn't match anything
        }
      }

      // Discover links
      try {
        const linkElements = await page.locator('a').all();
        for (const link of linkElements) {
          const text = await link.textContent().catch(() => '');
          const href = await link.getAttribute('href').catch(() => '');
          const isVisible = await link.isVisible().catch(() => false);
          if (isVisible) {
            elements.links.push({
              element: link,
              text: text.trim(),
              href,
              type: 'link'
            });
          }
        }
      } catch (error) {
        // Skip if no links found
      }

      // Discover form inputs
      const inputTypes = ['text', 'email', 'password', 'number', 'tel', 'url', 'search'];
      for (const inputType of inputTypes) {
        try {
          const inputElements = await page.locator(`input[type="${inputType}"]`).all();
          for (const input of inputElements) {
            const name = await input.getAttribute('name').catch(() => '');
            const placeholder = await input.getAttribute('placeholder').catch(() => '');
            const isVisible = await input.isVisible().catch(() => false);
            if (isVisible) {
              elements.inputs.push({
                element: input,
                name,
                placeholder,
                inputType,
                type: 'input'
              });
            }
          }
        } catch (error) {
          // Skip if no inputs of this type
        }
      }

      // Discover select elements
      try {
        const selectElements = await page.locator('select').all();
        for (const select of selectElements) {
          const name = await select.getAttribute('name').catch(() => '');
          const isVisible = await select.isVisible().catch(() => false);
          if (isVisible) {
            elements.selects.push({
              element: select,
              name,
              type: 'select'
            });
          }
        }
      } catch (error) {
        // Skip if no selects
      }

      // Discover textareas
      try {
        const textareaElements = await page.locator('textarea').all();
        for (const textarea of textareaElements) {
          const name = await textarea.getAttribute('name').catch(() => '');
          const placeholder = await textarea.getAttribute('placeholder').catch(() => '');
          const isVisible = await textarea.isVisible().catch(() => false);
          if (isVisible) {
            elements.textareas.push({
              element: textarea,
              name,
              placeholder,
              type: 'textarea'
            });
          }
        }
      } catch (error) {
        // Skip if no textareas
      }

      // Discover checkboxes and radios
      for (const inputType of ['checkbox', 'radio']) {
        try {
          const inputElements = await page.locator(`input[type="${inputType}"]`).all();
          for (const input of inputElements) {
            const name = await input.getAttribute('name').catch(() => '');
            const value = await input.getAttribute('value').catch(() => '');
            const isVisible = await input.isVisible().catch(() => false);
            if (isVisible) {
              elements[inputType + 's'].push({
                element: input,
                name,
                value,
                type: inputType
              });
            }
          }
        } catch (error) {
          // Skip if none found
        }
      }

      // Discover modals
      const modalSelectors = [
        '[role="dialog"]',
        '.modal',
        '.overlay',
        '[aria-modal="true"]'
      ];
      
      for (const selector of modalSelectors) {
        try {
          const modalElements = await page.locator(selector).all();
          for (const modal of modalElements) {
            const isVisible = await modal.isVisible().catch(() => false);
            if (isVisible) {
              elements.modals.push({
                element: modal,
                selector,
                type: 'modal'
              });
            }
          }
        } catch (error) {
          // Skip if no modals
        }
      }

      // Discover navigation elements
      const navSelectors = [
        'nav a',
        '[role="navigation"] a',
        '.navbar a',
        '.nav-link'
      ];
      
      for (const selector of navSelectors) {
        try {
          const navElements = await page.locator(selector).all();
          for (const nav of navElements) {
            const text = await nav.textContent().catch(() => '');
            const href = await nav.getAttribute('href').catch(() => '');
            const isVisible = await nav.isVisible().catch(() => false);
            if (isVisible) {
              elements.navigation.push({
                element: nav,
                text: text.trim(),
                href,
                type: 'navigation'
              });
            }
          }
        } catch (error) {
          // Skip if no nav elements
        }
      }

      // Discover error elements
      const errorSelectors = [
        '.error',
        '[role="alert"]',
        '.error-message',
        '.alert-danger',
        '.text-red',
        '.text-destructive'
      ];
      
      for (const selector of errorSelectors) {
        try {
          const errorElements = await page.locator(selector).all();
          for (const error of errorElements) {
            const text = await error.textContent().catch(() => '');
            const isVisible = await error.isVisible().catch(() => false);
            if (isVisible && text.trim()) {
              elements.errors.push({
                element: error,
                text: text.trim(),
                selector,
                type: 'error'
              });
            }
          }
        } catch (error) {
          // Skip if no error elements
        }
      }

      // Discover forms
      try {
        const formElements = await page.locator('form').all();
        for (const form of formElements) {
          const action = await form.getAttribute('action').catch(() => '');
          const method = await form.getAttribute('method').catch(() => '');
          const isVisible = await form.isVisible().catch(() => false);
          if (isVisible) {
            elements.forms.push({
              element: form,
              action,
              method,
              type: 'form'
            });
          }
        }
      } catch (error) {
        // Skip if no forms
      }

    } catch (error) {
      console.log('Error during element discovery:', error.message);
    }

    return elements;
  }

  /**
   * Get a summary of discovered elements
   * @param {Object} elements - Elements discovered by discoverInteractiveElements
   * @returns {Object} - Summary statistics
   */
  static getElementSummary(elements) {
    const summary = {};
    
    Object.keys(elements).forEach(category => {
      summary[category] = {
        count: elements[category].length,
        items: elements[category].map(el => el.text || el.name || el.selector || 'unnamed')
      };
    });

    return summary;
  }

  /**
   * Safely click an element with error handling
   * @param {Locator} element - Element to click
   * @param {Object} options - Click options
   * @returns {Object} - Result of click attempt
   */
  static async safeClick(element, options = {}) {
    const result = {
      success: false,
      error: null,
      action: 'click'
    };

    try {
      // Check if element is still visible and enabled
      const isVisible = await element.isVisible().catch(() => false);
      const isEnabled = await element.isEnabled().catch(() => false);
      
      if (!isVisible) {
        result.error = 'Element is not visible';
        return result;
      }
      
      if (!isEnabled) {
        result.error = 'Element is disabled';
        return result;
      }

      // Attempt click with timeout
      await element.click({ timeout: 2000, ...options });
      result.success = true;
      
    } catch (error) {
      result.error = error.message;
    }

    return result;
  }

  /**
   * Safely fill an input with error handling
   * @param {Locator} element - Input element to fill
   * @param {string} value - Value to fill
   * @returns {Object} - Result of fill attempt
   */
  static async safeFill(element, value) {
    const result = {
      success: false,
      error: null,
      action: 'fill',
      value
    };

    try {
      const isVisible = await element.isVisible().catch(() => false);
      const isEnabled = await element.isEnabled().catch(() => false);
      
      if (!isVisible) {
        result.error = 'Element is not visible';
        return result;
      }
      
      if (!isEnabled) {
        result.error = 'Element is disabled';
        return result;
      }

      await element.fill(value, { timeout: 2000 });
      result.success = true;
      
    } catch (error) {
      result.error = error.message;
    }

    return result;
  }
} 