// @ts-nocheck
import PersonRepository from '../../repositories/PersonRepository.js';
import { activitySubmissionRepository } from '../../repositories/ActivityRepository.js';
import materialRepository from '../../repositories/MaterialRepository.js';
import { getStorageService } from './index.js';

class MediaUrlService {
    async refreshPerson(person) {
        if (!person?.storage_bucket || !person?.storage_key) {
            return person;
        }

        const storage = getStorageService();
        if (!storage.isSignedUrlStale(person.storage_signed_url_expires_at) && person.storage_signed_url) {
            person.profile_photo_url = person.storage_signed_url;
            return person;
        }

        const signed = await storage.buildSignedUrl({
            bucket: person.storage_bucket,
            key: person.storage_key,
        });

        await PersonRepository.update(person._id, {
            storage_signed_url: signed.url,
            storage_signed_url_expires_at: signed.expiresAt,
            profile_photo_url: signed.url,
        });

        person.storage_signed_url = signed.url;
        person.storage_signed_url_expires_at = signed.expiresAt;
        person.profile_photo_url = signed.url;
        return person;
    }

    async refreshSubmission(submission) {
        if (!submission?.storage_bucket || !submission?.storage_key) {
            return submission;
        }

        const storage = getStorageService();
        if (!storage.isSignedUrlStale(submission.storage_signed_url_expires_at) && submission.storage_signed_url) {
            submission.file_url = submission.storage_signed_url;
            return submission;
        }

        const signed = await storage.buildSignedUrl({
            bucket: submission.storage_bucket,
            key: submission.storage_key,
        });

        await activitySubmissionRepository.update(submission._id, {
            storage_signed_url: signed.url,
            storage_signed_url_expires_at: signed.expiresAt,
            file_url: signed.url,
        });

        submission.storage_signed_url = signed.url;
        submission.storage_signed_url_expires_at = signed.expiresAt;
        submission.file_url = signed.url;
        return submission;
    }

    async refreshUser(user) {
        if (!user?.person_id) return user;
        await this.refreshPerson(user.person_id);
        return user;
    }

    async refreshUsers(users = []) {
        await Promise.all((users || []).map((user) => this.refreshUser(user)));
        return users;
    }

    async refreshSubmissions(submissions = []) {
        await Promise.all((submissions || []).map((submission) => this.refreshSubmission(submission)));
        return submissions;
    }

    async refreshMaterial(material) {
        if (!material?.storage_bucket || !material?.storage_key) return material;

        const storage = getStorageService();
        if (!storage.isSignedUrlStale(material.storage_signed_url_expires_at) && material.storage_signed_url) {
            material.file_url = material.storage_signed_url;
            return material;
        }

        const signed = await storage.buildSignedUrl({ bucket: material.storage_bucket, key: material.storage_key });
        await materialRepository.update(material._id, {
            storage_signed_url: signed.url,
            storage_signed_url_expires_at: signed.expiresAt,
            file_url: signed.url,
        });
        material.storage_signed_url = signed.url;
        material.storage_signed_url_expires_at = signed.expiresAt;
        material.file_url = signed.url;
        return material;
    }

    async refreshMaterials(materials = []) {
        await Promise.all((materials || []).map((material) => this.refreshMaterial(material)));
        return materials;
    }
}

export default new MediaUrlService();
