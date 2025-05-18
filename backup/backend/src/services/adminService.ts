export const adminService = {
  async analyzeDataForCleanup(resourceType: string) {
    const changes = [];
    
    switch (resourceType) {
      case 'restaurants':
        changes.push(...await this.analyzeRestaurantData());
        break;
      case 'dishes':
        changes.push(...await this.analyzeDishData());
        break;
      case 'users':
        changes.push(...await this.analyzeUserData());
        break;
      case 'submissions':
        changes.push(...await this.analyzeSubmissionData());
        break;
      default:
        throw new Error(`Unsupported resource type: ${resourceType}`);
    }

    return changes;
  },

  async analyzeRestaurantData() {
    const changes = [];
    const restaurants = await prisma.restaurant.findMany();

    // Analyze missing neighborhoods
    for (const restaurant of restaurants) {
      if (!restaurant.neighborhood && restaurant.zipCode) {
        // Find other restaurants in same zip code with neighborhood data
        const similarRestaurants = await prisma.restaurant.findMany({
          where: {
            zipCode: restaurant.zipCode,
            neighborhood: { not: null }
          }
        });

        if (similarRestaurants.length > 0) {
          // Use most common neighborhood
          const neighborhoods = similarRestaurants.map(r => r.neighborhood);
          const mostCommonNeighborhood = this.findMostCommon(neighborhoods);

          changes.push({
            id: `neighborhood-${restaurant.id}`,
            title: 'Add Missing Neighborhood',
            category: 'Location Data',
            currentValue: null,
            proposedValue: mostCommonNeighborhood,
            impact: 'Will update neighborhood based on zip code data',
            confidence: 0.9
          });
        }
      }

      // Analyze phone number format
      if (restaurant.phone) {
        const formattedPhone = this.formatPhoneNumber(restaurant.phone);
        if (formattedPhone !== restaurant.phone) {
          changes.push({
            id: `phone-${restaurant.id}`,
            title: 'Standardize Phone Number',
            category: 'Contact Information',
            currentValue: restaurant.phone,
            proposedValue: formattedPhone,
            impact: 'Will update phone number format',
            confidence: 1.0
          });
        }
      }

      // Analyze website URL
      if (restaurant.website) {
        const formattedUrl = this.formatWebsiteUrl(restaurant.website);
        if (formattedUrl !== restaurant.website) {
          changes.push({
            id: `website-${restaurant.id}`,
            title: 'Standardize Website URL',
            category: 'Contact Information',
            currentValue: restaurant.website,
            proposedValue: formattedUrl,
            impact: 'Will update website URL format',
            confidence: 1.0
          });
        }
      }
    }

    return changes;
  },

  async analyzeDishData() {
    const changes = [];
    const dishes = await prisma.dish.findMany();

    // Analyze price formats
    for (const dish of dishes) {
      if (dish.price) {
        const formattedPrice = this.formatPrice(dish.price);
        if (formattedPrice !== dish.price) {
          changes.push({
            id: `price-${dish.id}`,
            title: 'Standardize Price Format',
            category: 'Pricing',
            currentValue: dish.price,
            proposedValue: formattedPrice,
            impact: 'Will update price format',
            confidence: 1.0
          });
        }
      }
    }

    return changes;
  },

  async analyzeUserData() {
    const changes = [];
    const users = await prisma.user.findMany();

    // Analyze email formats
    for (const user of users) {
      if (user.email) {
        const formattedEmail = user.email.toLowerCase().trim();
        if (formattedEmail !== user.email) {
          changes.push({
            id: `email-${user.id}`,
            title: 'Standardize Email Format',
            category: 'Contact Information',
            currentValue: user.email,
            proposedValue: formattedEmail,
            impact: 'Will update email format',
            confidence: 1.0
          });
        }
      }
    }

    return changes;
  },

  async analyzeSubmissionData() {
    const changes = [];
    const submissions = await prisma.submission.findMany();

    // Analyze submission data
    for (const submission of submissions) {
      if (submission.status === 'pending' && submission.createdAt < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) {
        changes.push({
          id: `status-${submission.id}`,
          title: 'Archive Old Pending Submission',
          category: 'Status Updates',
          currentValue: 'pending',
          proposedValue: 'archived',
          impact: 'Will archive submission older than 30 days',
          confidence: 0.8
        });
      }
    }

    return changes;
  },

  async applyCleanupChanges(resourceType: string, changeIds: string[]) {
    const changes = await this.analyzeDataForCleanup(resourceType);
    const approvedChanges = changes.filter(change => changeIds.includes(change.id));

    for (const change of approvedChanges) {
      await this.applyChange(change);
    }

    return { success: true, appliedChanges: approvedChanges.length };
  },

  async rejectCleanupChanges(resourceType: string, changeIds: string[]) {
    // Log rejected changes for future reference
    const changes = await this.analyzeDataForCleanup(resourceType);
    const rejectedChanges = changes.filter(change => changeIds.includes(change.id));

    await prisma.cleanupLog.createMany({
      data: rejectedChanges.map(change => ({
        resourceType,
        changeId: change.id,
        action: 'rejected',
        details: JSON.stringify(change)
      }))
    });

    return { success: true, rejectedChanges: rejectedChanges.length };
  },

  // Helper methods
  private findMostCommon(arr: string[]) {
    return arr.sort((a, b) =>
      arr.filter(v => v === a).length - arr.filter(v => v === b).length
    ).pop();
  },

  private formatPhoneNumber(phone: string) {
    // Implement phone number formatting logic
    return phone.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
  },

  private formatWebsiteUrl(url: string) {
    // Implement website URL formatting logic
    if (!url.startsWith('http')) {
      return `https://${url}`;
    }
    return url;
  },

  private formatPrice(price: string) {
    // Implement price formatting logic
    return `$${parseFloat(price).toFixed(2)}`;
  },

  private async applyChange(change: any) {
    const [type, id] = change.id.split('-');
    
    switch (type) {
      case 'neighborhood':
        await prisma.restaurant.update({
          where: { id },
          data: { neighborhood: change.proposedValue }
        });
        break;
      case 'phone':
        await prisma.restaurant.update({
          where: { id },
          data: { phone: change.proposedValue }
        });
        break;
      case 'website':
        await prisma.restaurant.update({
          where: { id },
          data: { website: change.proposedValue }
        });
        break;
      case 'price':
        await prisma.dish.update({
          where: { id },
          data: { price: change.proposedValue }
        });
        break;
      case 'email':
        await prisma.user.update({
          where: { id },
          data: { email: change.proposedValue }
        });
        break;
      case 'status':
        await prisma.submission.update({
          where: { id },
          data: { status: change.proposedValue }
        });
        break;
    }

    // Log the applied change
    await prisma.cleanupLog.create({
      data: {
        resourceType: change.category,
        changeId: change.id,
        action: 'applied',
        details: JSON.stringify(change)
      }
    });
  }
}; 